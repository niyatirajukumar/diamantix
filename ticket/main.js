import "../globals.css";
import "./local.css";
import { baseURL } from "../config";


document.addEventListener("DOMContentLoaded", async () => {
  let ticketId = getTicketId();
  if (!ticketId) {
    // window.location.href = "/";
  }
  let ticketDetails = getTikcetDetails(ticketId);
  console.log(ticketDetails);
  let res = await fetch(`${baseURL}/api/event/${ticketDetails.eventId}`);
  let data = await res.json();
  data.ticketId = ticketId;
  console.log(data);
  populateData(data);
});

document.querySelector("#download-ticket").addEventListener("click", () => {
  window.print();
});

function getTicketId() {
  let urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

function getTikcetDetails(ticketId) {
  // first 5 char => eventId
  // next 5 char => userId
  // at the end 0T => ticketId, 0A => attendedId
  let eventId = ticketId.slice(0, 5);
  let userId = ticketId.slice(5, 10);
  let type = ticketId.slice(10) == "0T" ? "ticket" : "attended";
  return { eventId, userId, type };
}

function populateData(data) {
  let eventDate = new Date(data.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  let imageUrl = data.thumbnail ? `https://ipfs.io/ipfs/${data.thumbnail}` : '/logo.png';
  let qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(data.ticketId)}&ecLevel=H&size=200&format=svg`
  document.querySelector('#event-thumbnail').src = imageUrl;
  document.querySelector('#event-name').textContent = data.name;
  document.querySelector('#event-date').textContent = eventDate;
  document.querySelector('#ticket-qr').src = qrUrl;
  document.querySelector('#event-location').textContent = data.location;
}