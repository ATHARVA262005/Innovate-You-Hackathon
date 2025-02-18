import { createContext, useState, useEffect } from "react";
import {
  getToken,
  getUser,
  isAuthenticated,
  removeToken,
} from "../services/auth.service.js";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // ✅ Retrieve user from localStorage on initial render
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        if (isAuthenticated()) {
          setUser(parsedUser);
        } else {
          removeToken();
          setUser(null);
        }
      } catch (error) {
        removeToken();
        setUser(null);
      }
    } else {
      removeToken();
      setUser(null);
    }

    setLoading(false);
  }, []); // 🔹 No dependencies, runs only once on mount

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};