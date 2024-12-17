import { Router } from "express";
import {authenticateToken} from "../middleware/authenticateToken.js";
import { verifyUser, getUser } from "../controllers/UserController/get.UserController.js";
import { logout, googleLogin } from "../controllers/UserController/auth.UserController.js";
const router = Router();


router.post('/googleLogin', googleLogin);
router.post("/logout", logout);
router.get("/auth-status/:authToken", authenticateToken, verifyUser);
router.get('/getuser', authenticateToken, getUser);

export default router;
