# Daimantix

A blockchain based proof-of-presence system for events.

## Usage Flow
1. Organiser Creates an event page and with event details, assests like images are uploaded to IPFS.
2. Users register for the event via the page using their wallet, upon confirmation by organiser, a ticket (as NFT) is generated and stored on the blockchain, and a qr code is generated which contains the wallet address of the user and the ticket id.
3. Users can then use the qr code to enter the event.
4. organisers will scan those qr and transfer the ticket (NFT) to their wallet. which will work as a proof of presence for them in the event.