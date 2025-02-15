import "dotenv/config";
import http from 'http';
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import UserModel from './models/user.model.js';
import app from './app.js';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';
import * as messageService from './services/message.service.js';
import { sendOTP, verifyOTP, resetPassword } from './services/auth.service.js';

const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

// Authenticate socket connection
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error("Invalid project ID"));
        }

        socket.project = await projectModel.findById(projectId);
        if (!socket.project) {
            return next(new Error("Project not found"));
        }

        if (!token) {
            return next(new Error("Authentication Error"));
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (!decoded) {
            return next(new Error("Invalid token"));
        }

        socket.user = decoded;
        next();
    } catch (error) {
        console.error(error);
        return next(new Error("Server Error"));
    }
});

io.on('connection', socket => {
    socket.roomId = socket.project._id.toString();
    console.log('New client connected');
    socket.join(socket.roomId);

    socket.on("project-message", async data => {
        const message = data.message;
        const aiIsPresentInMessage = message.toLowerCase().includes("@ai");

        if (aiIsPresentInMessage) {
            try {
                const prompt = message.replace("@ai", "").trim();
                const result = await generateResult(prompt, socket.roomId);
                await messageService.saveMessage({
                    projectId: socket.roomId,
                    sender: "BUTO AI",
                    message: result,
                    files: result.files || {},
                    buildSteps: result.buildSteps || [],
                    runCommands: result.runCommands || [],
                    prompt: prompt,
                    isAiResponse: true
                });

                io.to(socket.roomId).emit('project-message', {
                    message: result,
                    sender: "BUTO AI",
                    prompt: prompt
                });
            } catch (error) {
                console.error('AI Error:', error);
                io.to(socket.roomId).emit('project-message', {
                    message: { explanation: "Error processing AI request" },
                    sender: "BUTO AI"
                });
            }
        } else {
            await messageService.saveMessage({
                projectId: socket.roomId,
                sender: socket.user.email,
                message: data.message
            });

            socket.broadcast.to(socket.roomId).emit('project-message', {
                message: data.message,
                sender: socket.user.email
            });
        }
    });

    socket.on('disconnect', () => { console.log('Client disconnected'); });
});

// Authentication Routes for OTP & Password Reset
app.post('/auth/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const response = await sendOTP(email);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP" });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const response = await verifyOTP(email, otp);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: "Error verifying OTP" });
    }
});

app.post("/api/reset-password", async (req, res) => {
    console.log("📝 Reset Password Request Body:", req.body);
    
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        console.error("❌ Missing email or password");
        return res.status(400).json({ success: false, message: "Missing email or new password" });
    }

    const result = await resetPassword(email, newPassword);
    console.log("📩 Reset Password Response:", result);

    res.status(result.success ? 200 : 400).json(result);
});



server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if the user exists
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const response = await sendOTP(email); // Using existing OTP function for password reset
        res.status(200).json({ message: "Password reset OTP sent", response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error handling forgot password" });
    }
});