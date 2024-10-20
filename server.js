// import fs from 'node:fs'
// import path from 'node:path'
// import { fileURLToPath } from 'node:url'
import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import {
  Keypair,
  BASE_FEE,
  TransactionBuilder,
  Aurora,
  Networks,
  Operation,
  Asset,
} from "diamnet-sdk";
// import { createServer as createViteServer } from 'vite'

// const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
// vite specific code ---
// const vite = await createViteServer({
//   server: { middlewareMode: true },
//   appType: 'custom'
// });
// app.use(vite.middlewares);

// app.use('*', async (req, res, next) => {
//   const url = req.originalUrl
//   try {
//     let template = fs.readFileSync(
//       path.resolve(__dirname, 'index.html'),
//       'utf-8',
//     );
//     template = await vite.transformIndexHtml(url, template);
//     const { render } = await vite.ssrLoadModule('/src/entry-server.js');
//     const appHtml = await render(url);
//     const html = template.replace(`<!--ssr-outlet-->`, appHtml);
//     res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
//   } catch (e) {
//     vite.ssrFixStacktrace(e);
//     next(e);
//   }
// })
// end vite specific code ---

// --- Main Server Code ---
app.use(express.json());
// app.use(cors);


// Server wallet (main account) is fetched from .env
const serverWallet = Keypair.fromSecret(process.env.ISSUER_KEY);
// one account is created for each event, this is the distributor account that will be used to distribute the token to the users
const distributorWallet = Keypair.fromSecret(process.env.DISTRIBUTOR_KEY);
// Connect to the DiamCircle testnet using Aurora SDK.
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

async function createAccount(secretKey) {
  // create a new keypair
  let wallet = Keypair.fromSecret(secretKey);
  // get the server account
  let serverAccount = await server.loadAccount(serverWallet.publicKey());
  // create a transaction to create the new account with provided secret key
  let tx = new TransactionBuilder(serverAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.createAccount({
        destination: wallet.publicKey(),
        startingBalance: "0.000001",
        source: serverWallet.publicKey(),
      })
    )
    .setTimeout(0)
    .build();

  // sign the transaction with the server wallet and submit it
  tx.sign(serverWallet);
  server.submitTransaction(tx).then((result) => {
    console.log("Transaction successful", result);
  }).catch((error) => {
    console.error("Transaction failed", error.response.data.extras.result_codes);
  });
}

async function fundAccount(publicKey) {
  // use friendBot to fund the account
  let response = await fetch(`https://friendbot.diamcircle.io?addr=${publicKey}`);
  let responseJSON = await response.json();
  console.log("response", responseJSON);
}

/**
 * registers a user for an event, generates trust for assets and sends the ticket asset to the user.
 * @param {string} eventSlug 
 * @param {string} userAddress 
 * @param {object} metadata 
 * @returns {Promise<string>} XDR
 */
let i = 0;
async function registerUser(eventSlug, userAddress, metadata) {
  console.log(eventSlug + metadata.type);
  // create a new ticket asset and attended asset for the user
  // {i}T => ticket asset, {i}A => attended asset
  // i is the index of the user
  // TODO: implement a way to get the index of the user
  const ticketAsset = new Asset(eventSlug + i + "T", distributorWallet.publicKey());
  const attendedAsset = new Asset(eventSlug + i + "A", distributorWallet.publicKey());

  // load the master account
  const masterAccount = await server.loadAccount(serverWallet.publicKey());

  // calculate the total fee for the transaction
  const numOperations = 6;
  const totalFee = ((BASE_FEE * numOperations) / Math.pow(10, 7))

  // create a transaction to register the user
  const tx = new TransactionBuilder(masterAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    // get the required amount of the fee from the user
    .addOperation(
      Operation.payment({
        destination: serverWallet.publicKey(),
        asset: Asset.native(),
        amount: totalFee.toString(),
        source: userAddress,
      })
    )
    // make user trust the ticket asset
    .addOperation(
      Operation.changeTrust({
        asset: ticketAsset,
        source: userAddress,
      })
    )
    // create metadata for the ticket asset
    .addOperation(
      Operation.manageData({
        name: eventSlug + i + "T",
        source: distributorWallet.publicKey(),
        value: JSON.stringify(metadata),
      })
    )
    // send ticket asset to the user
    .addOperation(
      Operation.payment({
        destination: userAddress,
        source: distributorWallet.publicKey(),
        asset: ticketAsset,
        amount: "0.0000001",
      })
    )
    // make user trust the attended asset
    .addOperation(
      Operation.changeTrust({
        asset: attendedAsset,
        source: userAddress,
      })
    )
    // create metadata for the attended asset
    .addOperation(
      Operation.manageData({
        name: eventSlug + i + "A",
        source: distributorWallet.publicKey(),
        value: JSON.stringify(metadata),
      })
    )
    .setTimeout(0)
    .build();

  // sign
  tx.sign(serverWallet, distributorWallet);

  // convert to XDR to be sent for signing via wallet extension by the user
  let xdr = tx.toXDR();
  console.log(ticketAsset, attendedAsset);
  return xdr;
}

/**
 * Send a specified asset to a user.
 * @param string} userAddress 
 * @param {Asset} asset 
 * @param {number} amount 
 * @returns {Promise<Transaction<Memo<MemoType>>}
 */
async function sendAsset(userAddress, asset, amount = "0.0000001") {
  // load the server account
  let serverAccount = await server.loadAccount(serverWallet.publicKey());

  // calculate the total fee for the transaction
  let numOperations = 2;
  let totalFee = ((BASE_FEE * numOperations) / Math.pow(10, 7)) + parseFloat(amount);

  // create the transaction
  let tx = new TransactionBuilder(serverAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    // transfer required amount to the distributor account
    .addOperation(
      Operation.payment({
        destination: distributorWallet.publicKey(),
        asset: Asset.native(),
        amount: totalFee.toString(),
        source: serverWallet.publicKey(),
      })
    )
    // send the asset to the user
    .addOperation(
      Operation.payment({
        destination: userAddress,
        source: distributorWallet.publicKey(),
        asset,
        amount,
      })
    )
    .setTimeout(0)
    .build();

  // sign the transaction and submit it to the network
  tx.sign(serverWallet, distributorWallet);

  // submit via server account
  server.submitTransaction(tx).then((result) => {
    console.log("Transaction successful");
    res.status(200).json({
      message: "Asset creation request received",
      success: true,
    });
  }).catch((error) => {
    console.error("Transaction failed", error.response.data.extras.result_codes);
    res.status(400).json({
      message: "Asset creation request failed",
      success: false,
    });
  });
  return tx;
}

app.post("/api/register", async (req, res) => {
  var { userAddress, eventSlug, metadata } = req.body;
  console.log("Received data:", { userAddress, eventSlug, metadata });
  if (!userAddress || !eventSlug || !metadata) {
    return res
      .status(400)
      .json({ error: "userAddress, eventSlug, and metadata are required" });
  }
  // TODO: check if user provided values are valid before proceeding

  // generate the XDR for the user to sign
  const xdr = await registerUser(eventSlug, userAddress, metadata);

  // send the XDR to the user
  res.status(200).json({
    message: "Asset creation request received",
    xdr: xdr,
    success: true,
  });
});

app.post("/api/verifyUserPresence", async (req, res) => {
  var { userAddress, ticketAsset, eventSlug } = req.body;
  console.log("Received data:", { userAddress, eventSlug });
  if (!userAddress || !eventSlug || !ticketAsset) {
    return res
      .status(400)
      .json({ error: "userAddress, eventSlug and ticketAsset are required" });
  }
  let userIndex = ticketAsset.replace(eventSlug, "").replace("T", "");

  // TODO: check if requester has the permission to verify user presence

  // after checks send the attended asset to the user
  let asset = new Asset(eventSlug + userIndex + "A", distributorWallet.publicKey());
  sendAsset(userAddress, asset);
});

// temp
app.get('/', (req, res) => {
  res.send('Boo!')
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Express Server listening on http://localhost:${process.env.PORT || 3000}`);
});