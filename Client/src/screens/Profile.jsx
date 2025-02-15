import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import { FiLogOut, FiUser } from "react-icons/fi";

const Profile = () => {
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                setUser(JSON.parse(storedUser));  // ✅ Restore user if available
            } else {
                navigate("/login");  // ✅ Redirect if no user data
            }
        }
    }, [user, setUser, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");  // ✅ Clear token
        localStorage.removeItem("user");   // ✅ Clear user data
        setUser(null);
        navigate("/login");  // ✅ Redirect to login page
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
                <div className="mb-4">
                    <FiUser className="text-5xl mx-auto text-gray-300" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Profile</h2>
                
                <div className="text-lg">
                    <p className="mb-2"><strong>Email:</strong> {user?.email || "N/A"}</p>
                </div>
                
                <button
                    onClick={handleLogout}
                    className="mt-6 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <FiLogOut />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Profile;
