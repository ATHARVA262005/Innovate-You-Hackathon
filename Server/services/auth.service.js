import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { sendEmail } from './email.service.js';
import User from '../models/user.model.js';

dotenv.config(); // Load environment variables

const SECRET_KEY = process.env.SECRET_KEY;
const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes expiry

// 🔹 Define OTP Schema for MongoDB
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true }, // Hashed OTP
    createdAt: { type: Date, default: Date.now, expires: '5m' }, // Auto-delete after 5 min
});

const OtpModel = mongoose.models.Otp || mongoose.model('Otp', otpSchema); // Ensure Model is created only once

// 🔹 Hash Password
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// 🔹 Compare Password
export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// 🔹 Generate JWT Token
export const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        SECRET_KEY,
        { expiresIn: '1h' } // Token expires in 1 hour
    );
};

// 🔹 Verify JWT Token
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return null;
    }
};

// 🔹 Send OTP (Secure & Uses MongoDB)
export const sendOTP = async (email) => {
    try {
        if (!OtpModel) {
            console.error("OtpModel is undefined! Ensure the model is initialized correctly.");
            return { success: false, message: "Internal server error" };
        }

        // Check if OTP was sent recently (Rate Limiting)
        const existingOtp = await OtpModel.findOne({ email });
        if (existingOtp) {
            const timeDiff = Date.now() - new Date(existingOtp.createdAt).getTime();
            if (timeDiff < 60000) { // 1-minute cooldown before resending
                return { success: false, message: "Please wait before requesting a new OTP" };
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await hashPassword(otp);

        // Save OTP in MongoDB (Replacing old one)
        await OtpModel.findOneAndUpdate(
            { email },
            { otp: hashedOtp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send OTP via Email
        const emailResult = await sendEmail(email, 'Your OTP Code', `Your OTP is ${otp}. It expires in 5 minutes.`);
        if (!emailResult.success) {
            return emailResult; // Return email error if failed
        }

        return { success: true, message: "OTP sent successfully!" };
    } catch (error) {
        console.error("Error in sendOTP function:", error);
        return { success: false, message: "Failed to send OTP" };
    }
};


// 🔹 Generate OTP
export const generateOTP = async (email) => {
    return sendOTP(email);
};

// 🔹 Verify OTP (Uses Hashed OTPs)
export const verifyOTP = async (email, enteredOTP) => {
    try {
        console.log("🔍 Searching for OTP with email:", email);
        
        const otpRecord = await OtpModel.findOne({ email });
        console.log("📌 OTP Record from DB:", otpRecord); // Log OTP record

        if (!otpRecord) {
            return { success: false, message: "OTP expired or not found" };
        }

        const isMatch = await bcrypt.compare(enteredOTP, otpRecord.otp);
        console.log("🔄 Comparing OTP:", enteredOTP, "with hashed OTP:", otpRecord.otp);

        if (!isMatch) {
            return { success: false, message: "Invalid OTP" };
        }

        await OtpModel.deleteOne({ email });
        console.log("✅ OTP Deleted After Verification");

        return { success: true, message: "OTP verified successfully!" };
    } catch (error) {
        console.error("❌ Error in verifyOTP:", error);
        return { success: false, message: "OTP verification failed" };
    }
};


// 🔹 Reset Password (Uses MongoDB)
export const resetPassword = async (email, newPassword) => {
    try {
        const user = await User.findOne({ email });
        console.log("🧐 Checking user existence:", user);
        if (!user) {
            console.error("❌ User not found in DB.");
            return { success: false, message: "User not found" };
        }
        console.log("🔍 Found user before update:", user);

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);
        console.log("🔑 Hashed Password:", hashedPassword);

        user.password = hashedPassword;
        user.passwordChangedAt = new Date();

        try {
            const updatedUser = await user.save();
            console.log("✅ Updated user after password reset:", updatedUser);
        } catch (saveError) {
            console.error("❌ Error saving updated user:", saveError);
            return { success: false, message: "Database update failed" };
        }

        // OPTIONAL: Send confirmation email
        await sendEmail(email, "Password Reset Confirmation", "Your password has been successfully reset.");

        return { success: true, message: "Password reset successfully" };
    } catch (error) {
        console.error("❌ Error in resetPassword function:", error);
        return { success: false, message: "Error resetting password" };
    }
};

// 🔹 Forgot Password - Sends OTP for Password Reset
export const forgotPassword = async (email) => {
    try {
        return await generateOTP(email);
    } catch (error) {
        console.error("Error in forgotPassword function:", error);
        return { success: false, message: "Error processing forgot password request" };
    }
};
