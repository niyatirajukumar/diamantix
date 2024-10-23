// import fs from 'node:fs'
// import path from 'node:path'
// import { fileURLToPath } from 'node:url'
import express, { request } from 'express'
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
import { JSONFilePreset } from 'lowdb/node';
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
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// app.use(cors);
const DB = await JSONFilePreset("db.json", { events: [], users: [], organisers: [] });

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
  return wallet;
}

async function fundAccount(wallet) {
  // use friendBot to fund the account
  let response = await fetch(`https://friendbot.diamcircle.io?addr=${wallet.publicKey()}`);
  let responseJSON = await response.json();
  console.log("response", responseJSON);
  return wallet;
}

/**
 * registers a user for an event, generates trust for assets and sends the ticket asset to the user.
 * @param {string} eventSlug 
 * @param {string} userAddress 
 * @param {object} metadata 
 * @returns {Promise<string>} XDR
 */
let i = 0;
async function registerUser(wallet, userAddress, uniqueIdentifier) {
  console.log(uniqueIdentifier);
  // create a new ticket asset and attended asset for the user
  // uniqueIdentifier + 0T => ticket asset, uniqueIdentifier + 0A => attended asset
  const ticketAsset = new Asset(uniqueIdentifier + "0T", wallet.publicKey());
  const attendedAsset = new Asset(uniqueIdentifier + "0A", wallet.publicKey());

  // load the master account
  const masterAccount = await server.loadAccount(serverWallet.publicKey());

  // calculate the total fee for the transaction
  const numOperations = 4;
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
    // .addOperation(
    //   Operation.manageData({
    //     name: uniqueIdentifier + "0T",
    //     source: wallet.publicKey(),
    //     value: uniqueIdentifier + "0T",
    //   })
    // )
    // send ticket asset to the user
    .addOperation(
      Operation.payment({
        destination: userAddress,
        source: wallet.publicKey(),
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
    // .addOperation(
    //   Operation.manageData({
    //     name: uniqueIdentifier + "0A",
    //     source: wallet.publicKey(),
    //     value: uniqueIdentifier + "0A",
    //   })
    // )
    .setTimeout(0)
    .build();

  // sign
  tx.sign(serverWallet, wallet);

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
async function sendAsset(wallet, userAddress, asset, amount = "0.0000001") {
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
        destination: wallet.publicKey(),
        asset: Asset.native(),
        amount: totalFee.toString(),
        source: serverWallet.publicKey(),
      })
    )
    // send the asset to the user
    .addOperation(
      Operation.payment({
        destination: userAddress,
        source: wallet.publicKey(),
        asset,
        amount,
      })
    )
    .setTimeout(0)
    .build();

  // sign the transaction and submit it to the network
  tx.sign(serverWallet, wallet);

  // submit via server account
  try {
    let result = await server.submitTransaction(tx);
    console.log("Transaction successful", result);
    return {
      message: "Asset creation request received",
      success: true,
    };
  } catch (error) {
    console.error("Transaction failed", error);
    return {
      message: "Asset creation request failed",
      success: false,
    };
  }
}

app.post("/api/register", async (req, res) => {
  var { name, email, publicKey, eventId } = req.body;
  console.log("Received data:", { name, email, publicKey, eventId });
  if (!name || !email || !publicKey || !eventId) {
    return res
      .status(400)
      .json({ message: "name, email, publicKey and eventId are required", success: false });
  }
  if (!DB.data.events.find(event => event.slug === eventId)) {
    return res.status(400).json({ message: "Invalid event", success: false });
  }
  if (DB.data.events.find(event => event.publicKey === publicKey)) {
    return res.status(400).json({ message: "You cannot join your own event", success: false });
  }
  if (DB.data.events.find(event => event.users.find(user => user.publicKey === publicKey))) {
    return res.status(400).json({ message: "User already registered", success: false });
  }

  let userSlug = generateSlug();

  // create a new user
  let user = {
    name,
    email,
    publicKey,
    eventId,
    hasAttended: false,
    ticketAsset: eventId + userSlug + "0T",
    attendedAsset: eventId + userSlug + "0A",
    slug: userSlug,
  };

  // save the user to the database
  let event = DB.data.events.find(event => event.slug === eventId);
  let privateKey = event.secretKey;
  let wallet = Keypair.fromSecret(privateKey);
  event.users.push(user);
  DB.write();

  // generate the XDR for the user to sign
  const xdr = await registerUser(wallet, publicKey, event.slug + userSlug);

  // send the XDR to the user
  res.status(200).json({
    message: "Asset creation request received",
    xdr: xdr,
    data: {
      userSlug,
      eventId,
      uniqueIdentifier: event.slug + userSlug,
      ticketAsset: event.slug + userSlug + "0T",
    },
    success: true,
  });
});

app.post("/api/verifyUserPresence", async (req, res) => {
  var { userSlug, privateKey, eventId } = req.body;
  console.log("Received data:", { userSlug, privateKey, eventId });
  if (!userSlug || !privateKey || !eventId) {
    return res
      .status(400)
      .json({ error: "userSlug, privateKey and eventId are required" });
  }
  if (!DB.data.events.find(event => event.slug === eventId)) {
    return res.status(400).json({ message: "Invalid event", success: false });
  }
  if (!DB.data.events.find(event => event.secretKey === privateKey)) {
    // unauthorized
    return res.status(401).json({ message: "Unauthorized", success: false });
  }
  if (!DB.data.events.find(event => event.users.find(user => user.slug === userSlug))) {
    return res.status(400).json({ message: "Invalid user", success: false });
  }

  let event = DB.data.events.find(event => event.slug === eventId);
  let wallet = Keypair.fromSecret(event.secretKey);

  // get the user and the ticket asset
  let user = event.users.find(user => user.slug === userSlug);

  // get the user's public key
  let userAddress = user.publicKey;

  // after checks send the attended asset to the user
  let asset = new Asset(eventId + userSlug + "0A", wallet.publicKey());
  let result = await sendAsset(wallet, userAddress, asset);

  // send the response
  if (result.success) {
    user.hasAttended = true;
    DB.write();
    res.status(200).json({
      message: "Asset creation request received",
      success: true,
      data: {
        userSlug,
        eventId,
        uniqueIdentifier: eventId + userSlug,
        attendedAsset: eventId + userSlug + "0A",
      }
    });
  }
  else {
    res.status(400).json(result);
  }
});

app.post("/api/createEvent", async (req, res) => {
  let { name, description, thumbnail, date, location, publicKey } = req.body;
  console.log(req.body);
  console.log("Received data:", { name, description, thumbnail, date, location, publicKey });
  if (!name || !description || !thumbnail || !date || !location || !publicKey) {
    return res
      .status(400)
      .json({ error: "name, description, thumbnail, date, and location are required" });
  }

  // create a unique event slug
  let eventSlug = generateSlug();

  // create a new secret key for the event
  let secretKey = Keypair.random().secret();

  // create an account for the event
  let wallet = await createAccount(secretKey);

  // fund the account
  // await fundAccount(wallet);

  // create the event
  let event = {
    name,
    description,
    thumbnail,
    date,
    location,
    slug: eventSlug,
    users: [],
    publicKey,
    secretKey,
  };

  // save the event to the database
  DB.data.events.push(event);
  DB.write();

  // send the response
  res.status(200).json({
    message: "Event creation request received",
    success: true,
    data: {
      eventSlug,
      publicKey,
      secretKey,
    },
  });
});

app.get("/api/events", (req, res) => {
  let events = DB.data.events;
  let data = events.map(event => {
    return {
      name: event.name,
      // description: event.description,
      thumbnail: event.thumbnail,
      date: event.date,
      location: event.location,
      slug: event.slug,
      publicKey: event.publicKey,
    };
  });
  res.status(200).json(data);
});

app.get("/api/myEvents", (req, res) => {
  let publicKey = req.query.publicKey;
  if (!publicKey) {
    return res.status(400).json({ message: "publicKey is required", success: false });
  }
  let events = DB.data.events.find(event => event.users.find(user => user.publicKey === publicKey));
  if (!events) {
    return res.status(200).json([]);
  }
  let data = events.map(event => {
    return {
      name: event.name,
      // description: event.description,
      thumbnail: event.thumbnail,
      date: event.date,
      location: event.location,
      slug: event.slug,
      publicKey: event.publicKey,
    };
  });

  res.status(200).json(data);
});

app.get("/api/event/:slug", (req, res) => {
  if (!req.params.slug) {
    return res.status(400).json({ message: "slug is required", success: false });
  }
  let event = DB.data.events.find(event => event.slug === req.params.slug);
  if (!event) {
    return res.status(404).json({ message: "Event not found", success: false });
  }
  let data = {
    name: event.name,
    description: event.description,
    thumbnail: event.thumbnail,
    date: event.date,
    location: event.location,
    slug: event.slug,
    publicKey: event.publicKey,
  };
  if (req.query.publicKey) {
    let user = event.users.find(user => user.publicKey === req.query.publicKey);
    data.isRegistered = user ? true : false;
    data.user = user;
  }
  res.status(200).json(data);
});

app.get("/api/event/:eventSlug/users", (req, res) => {
  // require privateKey
  let privateKey = req.query.privateKey;
  let eventId = req.params.eventSlug;
  if (!privateKey) {
    return res.status(401).json({ message: "privateKey is required", success: false });
  }
  if (!eventId) {
    return res.status(400).json({ message: "eventId is required", success: false });
  }
  let event = DB.data.events.find(event => event.secretKey === privateKey && event.slug === eventId);
  if (!event) {
    return res.status(401).json({ message: "Unauthorized", success: false });
  }

  let users = event.users;
  res.status(200).json(users);
});

// temp
app.get('/', (req, res) => {
  res.send('Boo!')
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Express Server listening on http://localhost:${process.env.PORT || 3000}`);
});

function generateSlug() {
  return Math.random().toString(36).substring(2, 7);
}