import "../globals.css";
import "../forms.css";
import "./local.css";

// let publicKey = localStorage.getItem("publicKey");
// if (!publicKey) {
//   document.querySelector("#connect-wallet").classList.toggle("hidden", false);
// }

document.querySelector("#connect-wallet").addEventListener("click", async () => {
  let publicKey = await connectWallet();
  if (!publicKey) {
    return;
  }
  // document.querySelector("#connect-wallet").classList.toggle("hidden", true);
});

document.querySelector("#create-event").addEventListener("submit", async (e) => {
  e.preventDefault();
  let formData = new FormData(e.target);
  let data = {};
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  let publicKey = localStorage.getItem("publicKey");
  if (!publicKey) {
    alert("Please connect your wallet first");
    return;
  }
  data.publicKey = publicKey;
  console.log(data);
  let imageHash = await uploadToIPFS(data.thumbnail);
  console.log("Image hash:", imageHash);
  console.log("Image URL:", `https://ipfs.io/ipfs/${imageHash}`);
  data.thumbnail = imageHash;
  let res = await fetch("http://localhost:3000/api/createEvent", {
    method: "POST",
    // mode: "no-cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  let json = await res.json();
  let privateKey = json.data.secretKey;
  localStorage.setItem(json.data.eventSlug + "-privateKey", privateKey);
  if(json.success) {
    alert("Event created successfully!");
    location.href = `/event/?id=${json.data.eventSlug}`;
  } else {
    alert("Failed to create event");
  }
  e.target.reset();
});

async function uploadToIPFS(file) {
  const formData = new FormData();
  formData.append('file', file);
  let res = await fetch('https://uploadipfs.diamcircle.io/api/v0/add', {
    method: 'POST',
    body: formData,
  });
  let hash;
  try {
    hash = (await res.json()).Hash;
    console.log("IPFS hash:", hash);
  } catch (error) {
    console.error("Error parsing response from IPFS:", error);
    throw error;
  }
  return hash;
}

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