import { useState } from "react";
import { verifyOTP, resetPassword } from "../services/auth.service";

const VerifyOTP = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleVerifyOTP = async () => {
        try {
            const response = await verifyOTP(email, otp);
            setMessage(response.message);
        } catch (error) {
            setMessage(error.error || "Invalid OTP");
        }
    };

    const handleResetPassword = async () => {
        try {
            const response = await resetPassword(email, otp, newPassword);
            setMessage(response.message);
        } catch (error) {
            setMessage(error.error || "Password reset failed");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-white text-center">Verify OTP & Reset Password</h2>
                
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border p-2 mt-4 w-full rounded"
                />

                <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="border p-2 mt-4 w-full rounded"
                />

                <button onClick={handleVerifyOTP} className="bg-green-500 text-white p-2 mt-4 w-full rounded">Verify OTP</button>

                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border p-2 mt-4 w-full rounded"
                />

                <button onClick={handleResetPassword} className="bg-blue-500 text-white p-2 mt-4 w-full rounded">Reset Password</button>

                {message && <p className="mt-4 text-red-500 text-center">{message}</p>}
            </div>
        </div>
    );
};

export default VerifyOTP;
