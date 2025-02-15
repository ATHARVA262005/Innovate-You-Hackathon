import express from "express";
import { forgotPassword, resetPassword } from "../services/auth.service.js";
import { generateOTP, verifyOTP, resendOTP } from "../services/otp.service.js"; // Use otp.service.js for OTP functions
import User from '../models/user.model.js'; // Ensure correct import

const router = express.Router();

/**
 * Resend OTP Route
 */
router.post("/resend-otp", async (req, res) => {
    try {
        console.log("Received request to resend OTP:", req.body);

        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const response = await resendOTP(email);

        console.log("🔄 Resend OTP Response:", response); // Debugging

        if (!response.success) {
            return res.status(400).json({ success: false, message: response.message });
        }

        return res.status(200).json({ success: true, message: response.message });
    } catch (error) {
        console.error("❌ Resend OTP Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

/**
 * Reset Password Route
 */
router.post("/reset-password", async (req, res) => {
    try {
        const { email, newPassword, otp } = req.body;

        if (!email || !newPassword || !otp) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Verify OTP
        const otpResponse = await verifyOTP(email, otp);
        if (!otpResponse) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Reset Password
        const response = await resetPassword(email, newPassword); // User model is referenced within the function
        return res.status(response.success ? 200 : 400).json(response);
    } catch (error) {
        console.error("❌ Reset Password Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

/**
 * Forgot Password Route
 * Sends OTP to user's email for password reset
 */
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Generate and send OTP
        const otp = await generateOTP(email);
        return res.status(200).json({ success: true, message: "OTP sent to email.", otp });
    } catch (error) {
        console.error("❌ Forgot Password Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

export default router;
