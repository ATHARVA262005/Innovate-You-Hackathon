import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: [6, "Email must be at least 6 characters long"],
        maxLength: [50, "Email must be at most 50 characters long"]
    },

    password:{
        type: String,
        select: false,
        required: true,
    },
});

userSchema.statics.hashPassword = function(password){
    return bcrypt.hash(password, 10);
}

userSchema.methods.validatePassword = function(password){
    return bcrypt.compare(password, this.password);
}

userSchema.methods.generateToken = function(){
    return jwt.sign({email: this.email}, process.env.SECRET_KEY, { expiresIn: '24h' });
}

userSchema.methods.comparePassword = function(password){
    return bcrypt.compare(password, this.password);
}



const User = mongoose.model("user", userSchema);

export default User;