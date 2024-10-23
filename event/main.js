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
    window.location.href =
      "https://chromewebstore.google.com/detail/diam-wallet/oakkognifoojdbfjaccegangippipdmn";
    throw new Error('Wallet extension not found');
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  let eventId = getEventId();
  if (!eventId) {
    window.location.href = "/";
  }
  let res = await fetch(`http://localhost:3000/api/event/${eventId}?publicKey=${localStorage.getItem("publicKey")}`);
  let event = await res.json();
  if (event.success == false) {
    alert(event.message);
    window.location.href = "/";
  }
  populateData(event);
});

document.querySelector("#register-btn").addEventListener("click", () => {
  document.querySelector("#register-dialog").showModal();
});

document.querySelector("#connect-wallet").addEventListener("click", async () => {
  let publicKey = await connectWallet();
  if (!publicKey) {
    alert('Failed to connect wallet');
    document.querySelector("#register-dialog").close();
    return;
  }
  // connect wallet
  // process
  // if success show details form and hide connect wallet button
  document.querySelector("#connect-wallet").classList.toggle("hidden", true);

  document.querySelector("#public-key").textContent = publicKey;
  document.querySelector("#public-key").setAttribute("title", publicKey);
  document.querySelector("#additional-details").classList.toggle("hidden", false);
});

document.querySelector("#register-from").addEventListener("submit", async (e) => {
  e.preventDefault();
  let formData = new FormData(e.target);
  let data = {};
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  data.publicKey = localStorage.getItem("publicKey");
  let eventId = getEventId();
  if (!eventId) {
    alert("Invalid event");
    return;
  }
  data.eventId = eventId;
  console.log(data); // { name, email, eventId, publicKey }
  // send data
  let res = await fetch("http://localhost:3000/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  let json = await res.json();
  let xdr = json.xdr;
  if (json.success == false) {
    return alert(json.message);
  }
  alert(json.message);
  location.reload();
  console.log("XDR:", xdr);
  console.log("Data:", json.data);
  signTransaction(xdr);
  document.querySelector("#register-dialog").close();
});

document.querySelector("#close-dialog").addEventListener("click", () => {
  closeDialog();
});


function getEventId() {
  return new URLSearchParams(window.location.search).get("id");
}

function closeDialog() {
  document.querySelector("#register-dialog").close();
  // clear form
  document.querySelector("#register-from").reset();
}

function signTransaction(xdr) {
  if (window.diam) {
    window.diam
      .sign(xdr, true, "Diamante Testnet 2024")
      .then((result) => {
        console.log("Transaction signed:", result);
        alert("Registered successfully");
      })
      .catch((error) => {
        console.error("Error signing transaction:", error);
        alert("An error occurred. Please try again");
      });
  } else {
    alert("Diam Wallet extension not found");
  }
}

function populateData(event) {
  let formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  document.querySelector(".event-name").textContent = event.name;
  document.querySelector(".event-meta").textContent = event.location;
  document.querySelector(".event-date").textContent = formattedDate;
  document.querySelector("#description-content").innerHTML = DOMPurify.sanitize(parse(event.description));
  let imageUrl = event.thumbnail ? `https://ipfs.io/ipfs/${event.thumbnail}` : "/logo.png";
  document.querySelector(".event-thumbnail").src = imageUrl;
  document.querySelector(".event-thumbnail").alt = event.name;
  document.querySelector("#organiser").href = `https://testnetexplorer.diamante.io/about-account/${event.publicKey}`;
  document.querySelector("#organiser").textContent = event.publicKey;
  let viewTicket = document.querySelector("#view-ticket");
  let registerButton = document.querySelector("#register-btn");
  let manageParticipants = document.querySelector("#manage-participants");
  let attendedToken = document.querySelector("#attended-token");
  let deleteEvent = document.querySelector(".delete-event");
  deleteEvent.addEventListener("click", async () => {
    let res = await fetch(`http://localhost:3000/api/event/${event.slug}/delete?privateKey=${localStorage.getItem(event.slug + "-privateKey")}`);
    let json = await res.json();
    if (json.success) {
      alert("Event deleted successfully");
      window.location.href = "/";
    }
  });
  if (event.isRegistered && event.user) {
    viewTicket.classList.toggle("hidden", false);
    viewTicket.href = `/ticket/?id=${event.user.ticketAsset}`;
    registerButton.classList.toggle("hidden", true);
  }
  if (event.isOrganiser) {
    registerButton.classList.toggle("hidden", true);
    deleteEvent.classList.toggle("hidden", false);
    viewTicket.classList.toggle("hidden", true);
    manageParticipants.classList.toggle("hidden", false);
    manageParticipants.href = `/attendance/?id=${event.slug}`;
  }
  if (event.hasAttended) {
    registerButton.classList.toggle("hidden", true);
    attendedToken.classList.toggle("hidden", false);
    attendedToken.addEventListener("click", () => {
      alert(`visit your diam wallet to view the asset named ${event.user.attendedAsset}`);
    });
  }
}