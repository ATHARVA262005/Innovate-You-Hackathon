import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const { setUser} = useContext(UserContext);

    const navigate = useNavigate();

    function submitHandler(e) {
        e.preventDefault();
        axios.post('/users/register', {
            email: email,
            password: password
        }).then((response) => {
            console.log(response.data);
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            navigate('/');
        }).catch((error) => {
            console.log(error.response.data);
        });
    }

  return (
    <div className="min-h-screen bg-gray-900 relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>
      
      <div className="bg-gray-800 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-800 relative z-10">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join us today!</p>
        </div>
        <form onSubmit={submitHandler} className="space-y-6">
          <div className="relative">
            <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-1">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full rounded-lg bg-white/10 border border-white/30 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-1">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full rounded-lg bg-white/10 border border-white/30 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-400"
                placeholder="Create a password"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-slate-700 text-white py-3 rounded-lg font-semibold border border-gray-800 hover:bg-[#222222] transition-all duration-300 relative overflow-hidden group"
          >
            <span className="relative z-10">Register</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </form>
        <p className="mt-6 text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;