import dotenv from 'dotenv';
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

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use('/slack', authRoutes); // Authentication routes
app.use('/api', approvalRoutes); // Approval routes
app.use('/slack', interactivityRoutes); // Interactivity routes
app.use('/api', userRoutes); // User routes
app.use('/slack', commandRoutes); // Command routes

// Endpoint to display "Hello"
app.get('/', (req, res) => {
    res.send('Hello');
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route to serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
