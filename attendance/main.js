import "../globals.css";
import "../forms.css";
import "./local.css";

function getEventId() {
  let url = new URL(window.location.href);
  return url.searchParams.get("id");
}

async function makeAttenance(userSlug) {
  let eventId = getEventId();
  if (!localStorage.getItem("privateKey")) {
    alert("Unauthorized!");
    return;
  }

  let res = await fetch("http://localhost:3000/api/verifyUserPresence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId, userSlug, privateKey: localStorage.getItem("privateKey") }),
  });
}

window.makeAttenance = makeAttenance; // temporary expose to the window object