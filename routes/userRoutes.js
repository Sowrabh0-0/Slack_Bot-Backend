import express from 'express';
import { getUserInfo } from '../controllers/userInfoController.js';

const router = express.Router();

// Route to get user information
router.get('/userinfo', getUserInfo);

export default router;
