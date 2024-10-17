import "../globals.css";
import "../forms.css";
import "./local.css";

document.querySelector("#create-event").addEventListener("submit", (e) => {
  e.preventDefault();
  let formData = new FormData(e.target);
  let data = {};
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  console.log(data); // "event-name", "event-thumbnail", "event-date", "event-location", "event-description", "organiser-details"
  // process
});