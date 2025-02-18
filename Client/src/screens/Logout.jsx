import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";

const Logout = () => {
    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        // ✅ Clear authentication data on logout
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null); // Clear user context

        // ✅ Redirect to login page immediately
        navigate("/login");
    }, [navigate, setUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
                <h2 className="text-3xl font-bold">Logging out...</h2>
                <p className="text-gray-400 mt-2">Redirecting to login page...</p>
            </div>
        </div>
    );
};

export default Logout;
