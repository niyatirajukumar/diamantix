import "../globals.css";
import "../forms.css";
import "./local.css";

import DOMPurify from "dompurify";
import { parse } from "marked";

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

document.querySelector("#connect-wallet").addEventListener("click", () => {
  let walletId;
  // connect wallet
  // process
  // if success show details form and hide connect wallet button
  document.querySelector("#connect-wallet").classList.toggle("hidden", true);

  // document.querySelector("#wallet-id").textContent = walletId;
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