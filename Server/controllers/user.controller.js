import userModel from "../models/user.model.js";
import * as userService from "../services/user.services.js";
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 */
export const createUserController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await userService.createUser(req.body);
    const token = user.generateToken(); // Call the method to generate token with _id included
    const { password, ...userData } = user._doc; // Remove password

    res.status(201).json({ user: userData, token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/users/login
 */
export const loginUserController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = user.generateToken(); // Call the method to generate token with _id included
    const { password: _, ...userData } = user._doc; // Remove password

    res.status(200).json({ user: userData, token });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

/**
 * @desc    Get logged-in user profile
 * @route   GET /api/users/profile
 */
export const profileUserController = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

/**
 * @desc    Logout user
 * @route   GET /api/users/logout
 */
export const logoutUserController = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (token) {
      await redisClient.set(token, "logout", "EX", 86400); // 24 hours expiry
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/users/all
 */
export const getAllUsersController = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const allUsers = await userService.getAllUsers({
      userId: loggedInUser._id,
    });
    res.status(200).json({ users: allUsers });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};
