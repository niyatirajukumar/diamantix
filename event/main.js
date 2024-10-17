import "../globals.css";
import "../forms.css";
import "./local.css";

import DOMPurify from "dompurify";
import { parse } from "marked";
import * as DiamSdk from "diamnet-sdk";

const server = new DiamSdk.Aurora.Server("https://diamtestnet.diamcircle.io/");
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";

async function connectWallet() {
  if (window.diam) {  // Checking if the Diam Wallet extension is installed
    try {
      const result = await window.diam.connect();
      const diamPublicKey = result.message[0].diamPublicKey;  // Fetches user's public key
      console.log(`User active public key is: ${diamPublicKey}`);
      localStorage.setItem('publicKey', diamPublicKey);  // Stores public key for later use
      return diamPublicKey;
    } catch (error) {
      console.error(`Error: ${error}`);
      alert('Failed to connect wallet');
      throw new Error('Failed to connect wallet');
    }
  } else {
    alert('Wallet extension not found');
    throw new Error('Wallet extension not found');
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  let eventId = getEventId();
  if (!eventId) {
    // window.location.href = "/";
  }
  // fetch event details
  // process
  // display event details
  let description = `# REPLACE THIS WITH ACTUAL CONTENT
  ### This is a subheading
  normal paragraph

  - list item 1
  - list item 2
  - list item 3

  **bold text**
  `;
  document.querySelector("#description-content").innerHTML = DOMPurify.sanitize(parse(description));
});

document.querySelector("#register-btn").addEventListener("click", () => {
  document.querySelector("#register-dialog").showModal();
});

document.querySelector("#connect-wallet").addEventListener("click", async () => {
  let publicKey = await connectWallet();
  // connect wallet
  // process
  // if success show details form and hide connect wallet button
  document.querySelector("#connect-wallet").classList.toggle("hidden", true);

  document.querySelector("#public-key").textContent = publicKey;
  document.querySelector("#public-key").setAttribute("title", publicKey);
  document.querySelector("#additional-details").classList.toggle("hidden", false);
});

document.querySelector("#register-from").addEventListener("submit", (e) => {
  e.preventDefault();
  let formData = new FormData(e.target);
  let data = {};
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  console.log(data); // { name, email }
  // process
  // if success, close dialog
  document.querySelector("#register-dialog").close();
});


function getEventId() {
  return new URLSearchParams(window.location.search).get("id");
}

// Get the modal
var modal = document.getElementById("connectWalletModal");

// Get the button that opens the modal (Register button)
var registerBtn = document.getElementById("registerButton");

// Get the <span> element that closes the modal
var closeBtn = document.getElementsByClassName("close-button")[0];

// When the user clicks on the button, open the modal
registerBtn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
closeBtn.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
