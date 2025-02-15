import jwtDecode from "jwt-decode";

/**
 * Save JWT token securely to sessionStorage
 * @param {string} token 
 */
export const saveToken = (token) => {
    if (!token) return;
    try {
        localStorage.setItem("token", token);
    } catch (error) {
        console.error("Error saving token:", error);
    }
};

/**
 * Retrieve JWT token from sessionStorage
 * @returns {string | null}
 */
export const getToken = () => {
    try {
        return localStorage.getItem("token") || null;
    } catch (error) {
        console.error("Error retrieving token:", error);
        return null;
    }
};

/**
 * Remove JWT token from sessionStorage
 */
export const removeToken = () => {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    } catch (error) {
        console.error("Error removing token:", error);
    }
};

/**
 * Check if user is authenticated based on JWT validity
 * @returns {boolean}
 */
export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    try {
        const payload = jwtDecode(token);
        if (payload.exp < Date.now() / 1000) {
            removeToken(); // Token expired, remove it
            return false;
        }
        return true;
    } catch (error) {
        console.error("Invalid token:", error);
        removeToken();
        return false;
    }
};

/**
 * Get user details from the token
 * @returns {object | null} Decoded user data
 */
export const getUser = () => {
    const token = getToken();
    if (!token) return null;

    try {
        return jwtDecode(token);
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};

/**
 * Forgot Password API Call
 * @param {string} email 
 * @returns {Promise<object>}
 */
export const forgotPassword = async (email) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Error in forgot password request:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
};

/**
 * Verify OTP API Call
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<object>}
 */
export const verifyOTP = async (email, otp) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
};

/**
 * Reset Password API Call
 * @param {string} email 
 * @param {string} newPassword 
 * @param {string} otp 
 * @returns {Promise<object>}
 */
export const resetPassword = async (email, newPassword, otp) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, newPassword, otp }),
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Error resetting password:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
};
