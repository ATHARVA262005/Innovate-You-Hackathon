import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiShield, FiEye, FiEyeOff, FiRefreshCw, FiLoader } from 'react-icons/fi';
import { forgotPassword, verifyOTP, resetPassword } from "../services/auth.service";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ label: '', color: '', percentage: 0 });
    const [timer, setTimer] = useState(0);
    const [formTouched, setFormTouched] = useState(false);

    const checkPasswordStrength = (password) => {
        let strength = { label: 'Weak ❌', color: 'bg-red-500', percentage: 20 };
    
        if (password.length >= 8) {
            strength = { label: 'Medium ⚠️', color: 'bg-yellow-400', percentage: 50 };
        }
    
        if (/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(password) && password.length >= 8) {
            strength = { label: 'Strong ✅', color: 'bg-green-500', percentage: 75 };
        }
    
        if (/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(password) && password.length >= 12) {
            strength = { label: 'Very Strong 🔥', color: 'bg-blue-500', percentage: 100 };
        }
    
        setPasswordStrength(strength);
    };

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    useEffect(() => {
        if (step === 2) {
            document.getElementById("otpInput")?.focus();
        }
    }, [step]);

    const handleInputChange = (e, setter) => {
        setter(e.target.value);
        if (!formTouched) setFormTouched(true);
    };

    const validateForm = () => {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handlePaste = (e) => {
        e.preventDefault();
        setMessage("Pasting is not allowed for confirm password!");
        setMessageType("error");
    };

    const handleForgotPassword = async () => {
        if (!validateForm()) {
            setMessage("Please enter a valid email!");
            setMessageType("error");
            return;
        }

        setLoading(true);
        try {
            const response = await forgotPassword(email);
            setMessage(response?.message || "OTP sent to your email.");
            setMessageType("success");
            setStep(2);
            setTimer(60);
        } catch (error) {
            setMessage(error.response?.data?.error || "Error requesting OTP.");
            setMessageType("error");
            // Subtle shake animation on error
            const form = document.getElementById("forgotPasswordForm");
            form.classList.add("animate-shake");
            setTimeout(() => form.classList.remove("animate-shake"), 500);
        }
        setLoading(false);
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            setMessage("Please enter the OTP!");
            setMessageType("error");
            return;
        }

        setLoading(true);
        try {
            const response = await verifyOTP(email, otp);
            if (response?.success) {
                setMessage("OTP verified! Set your new password.");
                setMessageType("success");
                setStep(3);
            } else {
                setMessage("Invalid OTP. Try again.");
                setMessageType("error");
            }
        } catch (error) {
            setMessage(error.response?.data?.error || "Error verifying OTP.");
            setMessageType("error");
        }
        setLoading(false);
    };

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match!");
            setMessageType("error");
            return;
        }

        if (passwordStrength.percentage < 75) {
            setMessage("Password is too weak. Use a stronger password.");
            setMessageType("error");
            return;
        }

        setLoading(true);
        try {
            const response = await resetPassword(email, newPassword, otp);
            if (response?.success) {
                setMessage("Password reset successful! You can now log in.");
                setMessageType("success");
                setStep(4);
            } else {
                setMessage("Failed to reset password.");
                setMessageType("error");
            }
        } catch (error) {
            setMessage(error.response?.data?.error || "Error resetting password.");
            setMessageType("error");
        }
        setLoading(false);
    };

    const resendOtp = async () => {
        if (timer > 0) return;
        try {
            const response = await forgotPassword(email);
            setMessage("New OTP sent to your email.");
            setMessageType("success");
            setTimer(60);
        } catch (error) {
            setMessage(error.response?.data?.error || "Failed to resend OTP.");
            setMessageType("error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Enhanced background gradients */}
            <div className="absolute inset-0">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50 relative z-10 transform transition-all duration-300 hover:shadow-purple-500/5">
                <div className="mb-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Reset Password
                    </h2>
                    <p className="text-gray-400">We'll help you recover your account</p>
                </div>

                {message && (
                    <div className={`text-sm text-center p-3 mb-4 rounded-lg border ${
                        messageType === 'success' 
                            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                    } transform transition-all duration-300 animate-fadeIn`}>
                        {message}
                    </div>
                )}

                {step === 1 && (
                    <form id="forgotPasswordForm" className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                            <div className="relative group">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-purple-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => handleInputChange(e, setEmail)}
                                    className="pl-10 w-full rounded-lg bg-gray-900/50 border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-gray-600"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleForgotPassword}
                            type="button"
                            disabled={loading || (formTouched && !validateForm())}
                            className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 relative overflow-hidden group
                                ${loading || (formTouched && !validateForm())
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40'
                                }
                            `}
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {loading && <FiLoader className="animate-spin mr-2" />}
                                {loading ? 'Sending OTP...' : 'Request OTP'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Enter OTP</label>
                            <div className="relative group">
                                <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-purple-400" />
                                <input
                                    type="text"
                                    id="otpInput"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="pl-10 w-full rounded-lg bg-gray-900/50 border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-gray-600"
                                    placeholder="Enter verification code"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleVerifyOtp}
                            type="button"
                            disabled={loading}
                            className="w-full py-3 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all duration-300 relative overflow-hidden group shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {loading && <FiLoader className="animate-spin mr-2" />}
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <button 
                            type="button"
                            onClick={resendOtp}
                            disabled={timer > 0}
                            className={`flex items-center justify-center w-full text-sm ${
                                timer > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300 transition-colors'
                            }`}
                        >
                            <FiRefreshCw className={`mr-2 ${timer > 0 && 'animate-spin'}`} />
                            {timer > 0 ? `Resend OTP (${timer}s)` : 'Resend OTP'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                            <div className="relative group">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-purple-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        checkPasswordStrength(e.target.value);
                                    }}
                                    className="pl-10 pr-10 w-full rounded-lg bg-gray-900/50 border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-gray-600"
                                    placeholder="Create new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                            {newPassword && (
                                <div className="mt-2">
                                    <div className="w-full h-2 bg-gray-700 rounded-lg overflow-hidden">
                                        <div 
                                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                            style={{ width: `${passwordStrength.percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-sm mt-1 text-gray-300">{passwordStrength.label}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                            <div className="relative group">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-purple-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onPaste={handlePaste}
                                    onDrop={handlePaste}
                                    className="pl-10 pr-10 w-full rounded-lg bg-gray-900/50 border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-gray-600"
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                                >
                                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleResetPassword}
                            type="button"
                            disabled={loading}
                            className="w-full py-3 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all duration-300 relative overflow-hidden group shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {loading && <FiLoader className="animate-spin mr-2" />}
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <div className="text-center text-green-400 mb-4">
                            <p className="text-lg font-medium">Password Reset Successful!</p>
                            <p className="text-gray-400 mt-2">Your password has been updated. You can now log in with your new password.</p>
                        </div>
                        <Link 
                            to="/login"
                            className="block w-full py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-500 text-white transition-all duration-300 text-center relative overflow-hidden group shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
                        >
                            <span className="relative z-10">Go to Login</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    </div>
                )}

                <p className="mt-8 text-center text-gray-400">
                    Remember your password?{' '}
                    <Link 
                        to="/login" 
                        className="text-purple-400 hover:text-purple-300 transition-colors font-medium hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;