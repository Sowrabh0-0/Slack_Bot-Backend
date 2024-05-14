import express from 'express';
import { handleCommand } from '../controllers/commandController.js';

const router = express.Router();

router.post('/commands', handleCommand);

export default router;
