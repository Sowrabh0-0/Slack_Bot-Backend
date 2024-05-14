import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import interactivityRoutes from './routes/interactivityRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commandRoutes from './routes/commandRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

console.log('Environment Variables:', {
  SLACK_ACCESS_TOKEN: process.env.SLACK_ACCESS_TOKEN,
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET
});

app.use('/slack', authRoutes);
app.use('/api', approvalRoutes);
app.use('/slack', interactivityRoutes);
app.use('/api', userRoutes);
app.use('/slack', commandRoutes);

app.get('/hello', (req, res) => {
  res.send('Hello');
});

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
