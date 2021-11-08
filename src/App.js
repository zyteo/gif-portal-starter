import { useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import kp from "./keypair.json";
import idl from "./idl.json";

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl("devnet");

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed",
};

// Change this up to be your Twitter if you want.
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  // useeffect ///////////////////////////////////////////
  // for checkifwalletconnected function
  const [walletAddress, setWalletAddress] = useState(null);
  // for input link
  const [inputValue, setInputValue] = useState("");
  // for the gif list
  const [gifList, setGifList] = useState([
    "https://media.giphy.com/media/slVWEctHZKvWU/giphy.gif",
    "https://media.giphy.com/media/ukpwkOzk6kafXwfwbH/giphy.gif",
    "https://media.giphy.com/media/HtqFbL7el09oY/giphy.gif",
    "https://media.giphy.com/media/rAm0u2k17rM3e/giphy.gif",
  ]);
  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");
          // Something like logging in
          // solana object gives us a function that will allow us to connect directly with the user's wallet!
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with public key:",
            response.publicKey.toString()
          );
          // set user publickey in state for later use
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * Let's define this method so our code doesn't break.
   */
  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log("Connected with public key:", response.publicKey.toString());
      // set user publickey in state for later use
      setWalletAddress(response.publicKey.toString());
    }
  };

  // handle function for the input link
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  // creating a provider which is an authenticated connection to Solana
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  // for the submit button
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!");
      return;
    }
    console.log("Gif link:", inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF sucesfully sent to program", inputValue);

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error);
    }
  };

  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (
    <>
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
      <p>Hi there! This is a decentralised app (dapp) that retrieves a GIF based on the link provided.</p>
      <p>This is my very first dapp and for visitors who have no idea what it is, let me try to explain. (Even though I'm really new to it too, so don't take my words at face value.)</p>
      <p>Normal internet as we know it is known as web 2. This dapp here would be considered web 3.</p>
      <p>Web 3 screams blockchain.</p>
      <p>Some of Web 3's features includes privacy + reduced censorship. Read more <a href="https://ethereum.org/en/developers/docs/web2-vs-web3/" target="_blank">here.</a></p>
      <p>Since this is hosted on blockchain, you would need a <a href="https://phantom.app/" target="_blank">phantom wallet</a> to make full use of this website.</p>
      <p>The currency being used is Solana. I'll be honest, I've never heard of it before starting this project.</p>
      <p>Once you connect your wallet, you'll have access to the page where you can enter the GIF link.</p>
      <p>When you click "GET GIF", you'll have to approve the transaction with a network fee cost.</p>
      <p>Once it's approved, you'll see the gif appear in the website.</p>
      <p>I've done it, to save you the hassle of setting up. Image below.</p>
      <img src="https://i.imgur.com/6ZqPwof.jpg" alt="pokegif" width="700px" height="500px"/>
      <p>Added 4 gifs below so visitors without wallet can at least look at some gifs...</p>
      <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt="" />
              </div>
            ))}
          </div>

    </>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <input
            type="text"
            placeholder="Please enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            GET GIF
          </button>
          <div className="gif-grid">
              <div className="gif-item" >
                <img src="https://media.giphy.com/media/HtqFbL7el09oY/giphy.gif" alt="" />
              </div>
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt="" />
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  // useeffects///////////////////////////////////////////////////////////////
  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    window.addEventListener("load", async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log("Error in getGifs: ", error);
      setGifList(null);
    }
  };

  // whenever there is a change in walletaddress
  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 PokeGIF</p>
          <p className="sub-text">PokeGIF collection in the metaverse ✨</p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {/* if walletaddress exists, show connected container */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div >
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
          <a
            className="footer"
            href="https://github.com/zyteo/gif-portal-starter"
            target="_blank"
            rel="noreferrer"
          >ZY signing off - ty buildspace for helping with my very first dapp!</a>
      </div>
    </div>
  );
};

export default App;
