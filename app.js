import { SOLANA_PRIVATE_KEY } from './solanaPrivateKey.js';
import { contractABI } from './contractABI.js';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

//Ether config
const EthContractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
let signer;
let contract;


//Solana
const LOCAL_SOLANA_RPC = "http://127.0.0.1:8899";
const TOKEN_MINT_ADDRESS = "ACePfcuBby8PALwPZkmFrdAp7UeZ1vZZbctDEmRPaHbd";
let solanaPublicKey;
const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(SOLANA_PRIVATE_KEY));

//wallet connection
let isMetaMaskConnected = false;
let isPhantomConnected = false;

// Connect MetaMask
async function connectMetaMask() {
  if (window.ethereum && window.ethereum.isMetaMask) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      signer = provider.getSigner();
      const senderAddress = await signer.getAddress();
      document.getElementById('metaMaskAddress').textContent = senderAddress;
      isMetaMaskConnected = true; // Mark MetaMask as connected
      console.log('MetaMask connected:', senderAddress);

      // Attempt to load balances after connecting MetaMask
      await loadBalances();
    } catch (error) {
      console.error('MetaMask connection failed:', error);
    }
  } else {
    alert('MetaMask is not installed.');
  }
}

//connect phantom wallet
async function connectPhantomWallet() {
  if ("solana" in window && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      solanaPublicKey = resp.publicKey;
      document.getElementById('solanaAddress').textContent = solanaPublicKey.toString();
      isPhantomConnected = true; // Mark Phantom as connected
      console.log('Phantom Wallet connected:', solanaPublicKey.toString());

      // Attempt to load balances after connecting Phantom
      await loadBalances();
    } catch (err) {
      console.error('Phantom Wallet connection failed:', err);
    }
  } else {
    alert('Phantom Wallet not found.');
  }
}

// Burn on Ethereum and Mint on Solana
async function sendFromEthereumToSolana(amount) {
  try {
    // Step 1: Burn tokens on Ethereum
    const senderAddress = await signer.getAddress(); // Get the connected MetaMask address
    contract = new ethers.Contract(EthContractAddress, contractABI, signer);

    const tx = await contract.burn(senderAddress, ethers.utils.parseUnits(amount, 18)); // Convert amount to smallest unit (wei)
    await tx.wait();
    console.log(`Burned ${amount} tokens on Ethereum`);

    // Step 2: Mint tokens on Solana
    const connection = new Connection(LOCAL_SOLANA_RPC, "confirmed");
    const token = new Token(connection, new PublicKey(TOKEN_MINT_ADDRESS), TOKEN_PROGRAM_ID, mintAuthority);

    // Get or create associated token account for the connected Phantom Wallet
    const tokenAccount = await token.getOrCreateAssociatedAccountInfo(solanaPublicKey);

    // Mint the equivalent amount on Solana (convert to 9 decimals)
    await token.mintTo(
      tokenAccount.address,
      mintAuthority.publicKey,
      [mintAuthority],
      Math.floor(amount * 10 ** 9) // Convert to smallest unit (lamports)
    );
    console.log(`Minted ${amount} tokens on Solana`);
    alert(`Transferred ${amount} tokens from Ethereum to Solana successfully.`);

    // Reload balances after transfer
    await loadBalances();
  } catch (err) {
    console.error('Error transferring from Ethereum to Solana:', err);
    alert('Transfer failed. Please check the console for details.');
  }
}


// Burn on Solana and Mint on Ethereum
async function sendFromSolanaToEthereum(amount) {
  try {
    const connection = new Connection(LOCAL_SOLANA_RPC, "confirmed");
    const token = new Token(connection, new PublicKey(TOKEN_MINT_ADDRESS), TOKEN_PROGRAM_ID, mintAuthority);
    const tokenAccount = await token.getOrCreateAssociatedAccountInfo(solanaPublicKey);

    // Step 1: Burn on Solana
    await token.burn(tokenAccount.address, solanaPublicKey, [], amount * 10 ** 9); // Convert to smallest unit
    console.log(`Burned ${amount} tokens on Solana`);

    // Step 2: Mint on Ethereum
    contract = new ethers.Contract(EthContractAddress, contractABI, signer);
    const tx = await contract.mint(await signer.getAddress(), ethers.utils.parseUnits(amount, 18));
    await tx.wait();
    console.log(`Minted ${amount} tokens on Ethereum`);
    alert(`Transferred ${amount} tokens from Solana to Ethereum`);

    await loadBalances();
  } catch (err) {
    console.error('Error transferring from Solana to Ethereum:', err);
    alert('Transfer failed. Check the console for details.');
  }
}

// Load Balances
async function loadBalances() {
  try {
    // Ensure both wallets are connected
    if (!isMetaMaskConnected || !isPhantomConnected) {
      console.log('Waiting for both wallets to connect...');
      return; // Exit early if wallets are not connected
    }

    // Load Ethereum balances
    if (signer) {
      const senderAddress = await signer.getAddress();
      contract = new ethers.Contract(EthContractAddress, contractABI, signer);
      const ethBalance = await contract.balanceOf(senderAddress);
      const etherBalance = await provider.getBalance(senderAddress);
      document.getElementById('tokenBalance').innerHTML = `Ethereum: ${ethers.utils.formatUnits(ethBalance, 18)} tokens`;
      document.getElementById('etherBalance').textContent = `ETH: ${ethers.utils.formatEther(etherBalance)}`;
    }

    // Load Solana balances
    if (solanaPublicKey) {
      const connection = new Connection(LOCAL_SOLANA_RPC, "confirmed");
      const token = new Token(connection, new PublicKey(TOKEN_MINT_ADDRESS), TOKEN_PROGRAM_ID, mintAuthority);
      const tokenAccount = await token.getOrCreateAssociatedAccountInfo(solanaPublicKey);
      const solBalance = await connection.getTokenAccountBalance(tokenAccount.address);
      document.getElementById('tokenBalance').innerHTML += `<br>Solana: ${solBalance.value.uiAmount} tokens`;
    }
  } catch (err) {
    console.error('Error loading balances:', err);
  }
}

document.getElementById('connectMetaMask').addEventListener('click', connectMetaMask);
document.getElementById('connectSolanaWallet').addEventListener('click', connectPhantomWallet);
document.getElementById('sendMetaMaskToPhantom').addEventListener('click', () => sendFromEthereumToSolana(document.getElementById('amount').value));
document.getElementById('sendPhantomToMetaMask').addEventListener('click', () => sendFromSolanaToEthereum(document.getElementById('amount').value));


async function fetchEtherPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    const price = data.ethereum.usd;

    document.getElementById('etherPrice').textContent = `$${price.toFixed(2)}`;
  } catch (error) {
    console.error('Error fetching Ether price:', error);
    document.getElementById('etherPrice').textContent = 'Error fetching price';
  }
}

window.addEventListener('load', fetchEtherPrice);
