import express from 'express';
import dotenv from 'dotenv';
import gameRoutes from './routes/game.routes.js';
import './utils/db.js';
import scanRoutes from './routes/scan.routes.js';
import locationRoutes from './routes/location.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Increase limit to handle base64-encoded images from the mobile client
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Lootr Backend is running! 🚀' });
});

app.use('/api/v1/game', gameRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/location', locationRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Lootr Backend is ALIVE!`);
  console.log(`Listening on port ${PORT}`);
  console.log(`=================================`);
});
