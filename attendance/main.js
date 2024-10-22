import "../globals.css";
import "../forms.css";
import "./local.css";
import QrScanner from 'qr-scanner';

const qrScanner = new QrScanner(
  document.querySelector("#view"),
  result => console.log('decoded qr code:', result),
  {
    highlightScanRegion: true,
    highlightCodeOutline: true,
  },
);

; (async () => {
  if(!(await QrScanner.hasCamera())) {
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


document.querySelector("#verify-attendance").addEventListener("submit", (e) => {
  e.preventDefault();
  let userSlug = document.querySelector("#user-slug").value;
  makeAttenance(userSlug);
});


function getEventId() {
  let url = new URL(window.location.href);
  return url.searchParams.get("id");
}

async function makeAttenance(userSlug) {
  let eventId = getEventId();
  if (!eventId) {
    alert("Invalid event");
    return;
  }
  if (!localStorage.getItem(eventId + "-privateKey")) {
    alert("Unauthorized!");
    return;
  }

  let res = await fetch("http://localhost:3000/api/verifyUserPresence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId, userSlug, privateKey: localStorage.getItem(eventId + "-privateKey") }),
  });
  let json = await res.json();
  if (!json.success) {
    return alert(json.message);
  }
  console.log(json);
  alert("Attendance verified successfully");
  return json;
}

window.makeAttenance = makeAttenance; // temporary expose to the window object