import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
  try {
    // Extract token from cookies or headers
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if the token is blacklisted
    const isBlacklisted = await redisClient.get(token);

    if (isBlacklisted) {
      res.cookie("token", "", { maxAge: 0 }); // Clear the token cookie
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Set the user on the request object
    req.user = { _id: decoded._id, email: decoded.email }; // Ensure _id is included
    console.log("Decoded user:", req.user); // Verify that _id is included in the log

    // Proceed to the next middleware
    next();
  } catch (error) {
    // Handle errors gracefully
    res.status(401).json({ message: error.message });
  }
};
