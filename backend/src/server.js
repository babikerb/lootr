import express from 'express';
import dotenv from 'dotenv';
import gameRoutes from './routes/game.routes.js';
import './utils/db.js';

// Load environment variables .env file
dotenv.config();

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

//allows your server to understand JSON data sent from the mobile app
app.use(express.json()); 

// making sure server is actually awake before testing the AI
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Lootr Backend is running! 🚀' });
});

// Mount feature routes 
app.use('/api/v1/game', gameRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Lootr Backend is ALIVE!`);
  console.log(`Listening on port ${PORT}`);
  console.log(`=================================`);
});