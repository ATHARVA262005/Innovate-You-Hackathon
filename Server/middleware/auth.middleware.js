import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Fix optional chaining

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const isBlacklisted = await redisClient.get(token);

        if (isBlacklisted) {
            res.cookie("token", "");
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Fix secret key reference
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};
