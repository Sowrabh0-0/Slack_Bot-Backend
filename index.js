import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import http from 'http'; // Import http to create a server
import { Server } from 'socket.io'; // Import socket.io
import authRoutes from './routes/authRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import interactivityRoutes from './routes/interactivityRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commandRoutes from './routes/commandRoutes.js';
import { initSocket } from './controllers/approvalController.js'; // Import the initSocket function

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = new Server(server, {
    cors: {
        origin: '*', // Allow CORS for all origins
    },
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Initialize Socket.io
initSocket(io); // Pass the io instance to the initSocket function

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
server.listen(PORT, () => { // Use server.listen instead of app.listen
    console.log(`Server is running on port ${PORT}`);
});
