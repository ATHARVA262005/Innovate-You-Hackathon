import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";
import User from '../models/user.model.js';
import { hashPassword } from "../services/auth.service.js";
import { generateOTP, verifyOTP } from "../services/otp.service.js";

const router = Router();

// Validation rules
const validateUser = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
];

// 📌 User Registration with OTP
router.post('/register', async (req, res) => {
    try {
        console.log("Register request received:", req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            console.log("❌ Missing fields:", { email, password });
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log("❌ User already exists:", email);
            return res.status(400).json({ message: "User already exists" });
        }

        // ✅ Generate and send OTP
        await generateOTP(email);

        console.log("✅ OTP sent to:", email);
        return res.status(200).json({ message: "OTP sent to email. Please verify to complete registration." });
    } catch (error) {
        console.error("❌ Register Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


// 📌 Verify OTP for Account Activation
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({ message: "Email, OTP, and password are required" });
        }

        // Verify OTP
        const isValid = await verifyOTP(email, otp);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Check if user already exists (avoid duplicate creation)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already verified. Please log in." });
        }

        // Hash password before saving user
        const hashedPassword = await hashPassword(password);

        // ✅ Create user after OTP verification
        const newUser = new User({ email, password: hashedPassword, isVerified: true });
        await newUser.save();

        console.log(`✅ User verified & registered: ${email}`);
        return res.status(201).json({ message: "Account verified successfully. You can now log in." });
    } catch (error) {
        console.error("❌ OTP Verification Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


// 📌 User Login (Only for Verified Users)
router.post('/login', validateUser, async (req, res) => {
    try {
        console.log("🔍 Login request received:", req.body);
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            console.log("❌ User not found:", email);
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.isVerified) {
            console.log("❌ Account not verified:", email);
            return res.status(403).json({ message: "Account not verified. Please verify your email." });
        }

        console.log("✅ User found. Proceeding to login...");
        return userController.loginUserController(req, res);
    } catch (error) {
        console.error("❌ Login Error:", error.message, error.stack);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// 📌 User Profile & Other Routes
router.get('/profile', authMiddleware.authUser, userController.profileUserController);
router.get('/logout', authMiddleware.authUser, userController.logoutUserController);
router.get('/all', authMiddleware.authUser, userController.getAllUsersController);

export default router;
