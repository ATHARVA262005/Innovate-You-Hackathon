import { Router } from "express";
import * as usercontroller from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post('/register', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long')
],
usercontroller.createUserController);

router.post('/login',[
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long')
], usercontroller.loginUserController);

router.get('/profile', authMiddleware.authUser , usercontroller.profileUserController);

router.get('/logout', authMiddleware.authUser, usercontroller.logoutUserController);

router.get('/all',authMiddleware.authUser, usercontroller.getAllUsersController);

export default router;
