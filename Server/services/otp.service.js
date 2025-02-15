import OTP from '../models/otp.model.js';
import { sendEmail } from './email.service.js';
import bcrypt from 'bcrypt';

// Function to generate a new OTP
const generateRandomOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

/**
 * Generate and store OTP for the given email
 */
export const generateOTP = async (email) => {
    const otp = generateRandomOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await OTP.findOneAndUpdate(
        { email },
        { otp: hashedOtp, createdAt: new Date() },
        { upsert: true, new: true }
    );

    await sendEmail(email, 'Your OTP Code', `Your OTP is ${otp}. It expires in 5 minutes.`);
    return true;
};

/**
 * Verify the OTP entered by the user
 */
export const verifyOTP = async (email, enteredOtp) => {
    console.log(`🔍 Verifying OTP for ${email}: ${enteredOtp}`);
    
    const record = await OTP.findOne({ email });
    if (!record) {
        console.log(`❌ Invalid or expired OTP for ${email}`);
        throw new Error('Invalid or expired OTP');
    }

    const isMatch = await bcrypt.compare(enteredOtp, record.otp);
    if (!isMatch) {
        console.log(`❌ Incorrect OTP for ${email}`);
        throw new Error('Invalid OTP');
    }

    console.log(`✅ OTP verified successfully for ${email}`);
    await OTP.deleteOne({ email }); // Remove OTP after successful verification
    return true;
};

/**
 * Resend OTP with cooldown to prevent abuse
 */
export const resendOTP = async (email) => {
    console.log(`🔄 Resending OTP for ${email}`);

    if (!email) {
        console.log("❌ Email is missing in request");
        return { success: false, message: "Email is required" };
    }

    // Check if OTP was sent recently (1-minute cooldown)
    const existingOtp = await OTP.findOne({ email });
    if (existingOtp) {
        const timeDiff = Date.now() - new Date(existingOtp.createdAt).getTime();
        if (timeDiff < 60000) { // 1-minute cooldown before resending
            console.log("⏳ OTP request too soon. Please wait before requesting a new OTP.");
            return { success: false, message: "Please wait 1 minute before requesting a new OTP." };
        }
    }

    const newOTP = await generateOTP(email); // Generate and send new OTP

    return { success: true, message: "OTP resent successfully", otp: newOTP }; // Return object
};

