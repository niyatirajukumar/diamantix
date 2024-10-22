import express from 'express';
import { JSONFile, Low } from 'lowdb';

const app = express();
const port = 3000;

// Set up LowDB to interact with db.json
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

// Middleware to parse JSON requests
app.use(express.json());

// Initialize the database structure
(async () => {
  await db.read();
  db.data ||= { registrations: [] };  // Add a default "registrations" array if none exists
  await db.write();
})();

// POST API to register a new user
app.post('/api/register', async (req, res) => {
  const { name, email, publicKey } = req.body;
  
  if (!name || !email || !publicKey) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Add a new registration to the db.json file
  const newRegistration = {
    id: db.data.registrations.length + 1,  // Auto-incrementing ID
    name,
    email,
    publicKey,
  };

  db.data.registrations.push(newRegistration);
  await db.write();  // Save the new data to `db.json`

  res.status(201).json({
    message: 'Registration successful',
    registration: newRegistration,
  });
});

// GET API to retrieve registrations
app.get('/api/registrations', async (req, res) => {
  await db.read();  // Read the latest data from `db.json`

  // Get all registrations
  const allRegistrations = db.data.registrations;

  // Example: Query a specific registration (e.g., with id 1)
  const specificRegistration = allRegistrations.find(r => r.id === 1);

  res.json({
    allRegistrations,  // Return all registrations
    specificRegistration,  // Return the specific registration
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
