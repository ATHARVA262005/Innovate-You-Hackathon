import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);
    const [formTouched, setFormTouched] = useState(false);
    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const validateForm = () => {
        if (!email || !password) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleInputChange = (e, setter) => {
        setter(e.target.value);
        if (!formTouched) setFormTouched(true);
    };

    async function submitHandler(e) {
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        
        try {
            const response = await axios.post('/users/login', { email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setUser(response.data.user);
            setMessage('Login successful! Redirecting...');
            setMessageType('success');
            
            // Animate loading state for better UX
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Invalid email or password. Please try again.');
            setMessageType('error');
            // Subtle shake animation on error
            const form = document.getElementById('loginForm');
            form.classList.add('animate-shake');
            setTimeout(() => form.classList.remove('animate-shake'), 500);
        } finally {
            setLoading(false);
        }
    }

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
                        Welcome Back
                    </h2>
                    <p className="text-gray-400">Sign in to your account</p>
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
                
                <form id="loginForm" onSubmit={submitHandler} className="space-y-6">
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
                                onChange={(e) => handleInputChange(e, setPassword)}
                                className="pl-10 pr-10 w-full rounded-lg bg-gray-900/50 border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-gray-600"
                                placeholder="••••••••"
                                required
                            />
                            <button 
                                type="button" 
                                onClick={togglePasswordVisibility} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Link 
                            to="/forgot-password" 
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium hover:underline"
                        >
                            Forgot your password?
                        </Link>
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
                            {loading ? 'Signing in...' : 'Sign in'}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </form>
                
                <p className="mt-8 text-center text-gray-400">
                    Don't have an account?{' '}
                    <Link 
                        to="/register" 
                        className="text-purple-400 hover:text-purple-300 transition-colors font-medium hover:underline"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;