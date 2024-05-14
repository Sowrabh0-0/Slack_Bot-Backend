import express from 'express';
import { getUserInfo } from '../controllers/userInfoController.js';

const router = express.Router();

router.get('/userinfo', getUserInfo);

export default router;
