import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiShield, FiEye, FiEyeOff, FiRefreshCw, FiLoader } from 'react-icons/fi';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ label: '', color: '', percentage: 0 });
    const [timer, setTimer] = useState(0);
    const [formTouched, setFormTouched] = useState(false);

    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

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

    const handleInputChange = (e, setter) => {
        setter(e.target.value);
        if (!formTouched) setFormTouched(true);
    };

    const validateForm = () => {
        if (!email || !password) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && passwordStrength.percentage >= 75;
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        
        try {
            await axios.post('/users/register', { email, password });
            setMessage('OTP sent to your email. Please verify.');
            setMessageType('success');
            setShowOtpInput(true);
            setTimer(60);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Registration failed.');
            setMessageType('error');
            // Subtle shake animation on error
            const form = document.getElementById('registerForm');
            form.classList.add('animate-shake');
            setTimeout(() => form.classList.remove('animate-shake'), 500);
        } finally {
            setLoading(false);
        }
    };

    const verifyOtpHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post('/users/verify-otp', { email, otp, password });
            setMessage('Account verified successfully! Redirecting to login...');
            setMessageType('success');
            setUser(response.data.user);
            setTimeout(() => navigate('/login'), 1500);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Invalid OTP.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        if (timer > 0) return;
        try {
            await axios.post('/auth/resend-otp', { email });
            setMessage("New OTP sent to your email.");
            setMessageType('success');
            setTimer(60);
        } catch (error) {
            setMessage(error.response?.data?.error || "Failed to resend OTP.");
            setMessageType('error');
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
                        Create Account
                    </h2>
                    <p className="text-gray-400">Join our community today</p>
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

                {!showOtpInput ? (
                    <form id="registerForm" onSubmit={submitHandler} className="space-y-6">
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

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                            <div className="relative group">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-purple-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        handleInputChange(e, setPassword);
                                        checkPasswordStrength(e.target.value);
                                    }}
                                    className="pl-10 pr-10 w-full rounded-lg bg-gray-900/50 border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-gray-600"
                                    placeholder="Create a strong password"
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
                            {password && (
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

                        <button
                            type="submit"
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
                                {loading ? 'Creating account...' : 'Create Account'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyOtpHandler} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Enter OTP</label>
                            <div className="relative group">
                                <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-purple-400" />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="pl-10 w-full rounded-lg bg-gray-900/50 border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-gray-600"
                                    placeholder="Enter verification code"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
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

                <p className="mt-8 text-center text-gray-400">
                    Already have an account?{' '}
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

export default Register;