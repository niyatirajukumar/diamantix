# Daimantix

A blockchain based proof-of-presence system for events.

Live Site: [diamantix.nmit.club](https://diamantix.nmit.club)

## Usage Flow
1. Organiser Creates an event page and with event details, assests like images are uploaded to IPFS.
2. Users register for the event via the page using their wallet, a ticket (as NFT) is generated and stored on the blockchain, and a qr code is generated which contains the details of the user's registration.
3. Users can then use the qr code to enter the event.
4. organisers will scan those qr or verify the user using the management UI and it will transfer the proof-of-presence token (NFT) to their wallet. Which verifies that the user has attended the event. and this can't be tampered with or duplicated.

Therby providing a secure and tamper-proof way of verifying the presence of a user at an event.

## Tech Stack
The project is based on Diamante which is a blockchain platform, and sdk for building blockchain applications. It also utilizes IPFS for storing assets like images.

## Features
- Create Event
- Register for Event
- Generate QR Code
- Verify User
- Transfer Proof-of-Presence Token
- View Event Details
- View User Details
- View Event Attendees

## Development
1. Clone the repository
2. Install dependencies
```bash
npm install
```
3. Start the development server
```bash
npm run dev
```
4. Open the browser and navigate to `http://localhost:5137`

## License
This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.
