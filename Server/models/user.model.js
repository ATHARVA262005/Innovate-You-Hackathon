import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  isVerified: { type: Boolean, default: false },
  resetToken: { type: String, default: null },
});

// Hash Password
userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

// Validate Password
userSchema.methods.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate JWT Token
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email },
    process.env.SECRET_KEY,
    { expiresIn: "24h" }
  ); // Include _id in the payload
};

const UserModel = mongoose.model("user", userSchema);
export default UserModel;
