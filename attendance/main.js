import "../globals.css";
import "../forms.css";
import "./local.css";
import QrScanner from 'qr-scanner';
import DOMPurify from "dompurify";
import { baseURL } from "../config";

document.addEventListener("DOMContentLoaded", async () => {
  let eventId = getEventId();
  if (!eventId) {
    window.location.href = "/";
  }
  let res = await fetch(`${baseURL}/api/event/${eventId}/users?privateKey=${localStorage.getItem(eventId + "-privateKey")}`);
  let users = await res.json();
  if (users.success == false) {
    alert("unauthorized!");
    location.href = "/event?id=" + eventId;
  }
  console.log(users);
  let usersEl = document.querySelector("#users");
  usersEl.innerHTML = users.map(user => userTemplate(user)).join("\n");
});

document.querySelector("#search").addEventListener("input", (e) => {
  let term = e.target.value;
  let users = document.querySelectorAll(".user");
  users.forEach(user => {
    let name = user.querySelector("h3").textContent;
    if (name.toLowerCase().includes(term.toLowerCase())) {
      user.classList.remove("hidden");
    } else {
      user.classList.add("hidden");
    }
  });
});


const qrScanner = new QrScanner(
  document.querySelector("#view"),
  result => console.log('decoded qr code:', result),
  {
    highlightScanRegion: true,
    highlightCodeOutline: true,
  },
);

; (async () => {
  if (!(await QrScanner.hasCamera())) {
    alert("No camera available");
    return;
  }
})


if (qrScanner.hasFlash()) {
  document.querySelector("#flash").addEventListener("click", () => {
    qrScanner.toggleFlash();
  });
}

document.querySelector("#start-stop").addEventListener("click", () => {
  if (qrScanner.isScanning) {
    qrScanner.stop();
    document.querySelector("#start-stop").textContent = "Scan QR";
  } else {
    qrScanner.start();
    document.querySelector("#start-stop").textContent = "Stop";
  }
});


// document.querySelector("#verify-attendance").addEventListener("submit", (e) => {
//   e.preventDefault();
//   let userSlug = document.querySelector("#user-slug").value;
//   makeAttendance(userSlug);
// });


function getEventId() {
  let url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function userTemplate(user) {
  return `<div class="user" data-slug="${user.slug}">
          <div class="user-details">
            <h3>${DOMPurify.sanitize(user.name)}</h3>
            <p>${DOMPurify.sanitize(user.email)}</p>
          </div>
          <button class="button ${user.hasAttended ? 'verified" disabled' : '"'}" onClick="makeAttendance('${user.slug}')" >${user.hasAttended ? "Verified" : "Verify"}</button>
        </div>`;
}

async function makeAttendance(userSlug) {
  let eventId = getEventId();
  if (!eventId) {
    alert("Invalid event");
    return;
  }
  if (!localStorage.getItem(eventId + "-privateKey")) {
    alert("Unauthorized!");
    return;
  }

  let res = await fetch(`${baseURL}/api/verifyUserPresence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId, userSlug, privateKey: localStorage.getItem(eventId + "-privateKey") }),
  });
  let json = await res.json();
  if (json.success == false) {
    return alert(json.message);
  }
  console.log(json);
  alert("Attendance verified successfully");
  return json;
}

window.makeAttendance = makeAttendance; // temporary expose to the window object