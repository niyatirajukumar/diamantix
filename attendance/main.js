import "../globals.css";
import "../forms.css";
import "./local.css";


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
  let json = await res.json();
  if (!json.success) {
    return alert(json.message);
  }
  console.log(json);
  alert("Attendance verified successfully");
  return json;
}

window.makeAttenance = makeAttenance; // temporary expose to the window object