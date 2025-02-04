import "dotenv/config";
import http from 'http';
import app from './app.js';
import {Server} from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import projectModal from './models/project.model.js';
import { generateResult } from './services/ai.service.js';
import * as messageService from './services/message.service.js';

const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: '*',
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error("Invalid project ID"));
        }

        socket.project = await projectModal.findById(projectId);



        


        if (!token){
            return next(new Error("Authentication Error"));
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        if(!decoded){
            return next(new Error("invalid token"));
        }

        socket.user = decoded;
        next();
    } catch (error) {
        console.error(error);
        
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
                const result = await generateResult(prompt);

                const filesArray = Object.entries(result.files || {}).map(([name, content]) => ({
                    name,
                    content
                  }));

                await messageService.saveMessage({
                    projectId: socket.roomId,
                    sender: "BUTO AI",
                    message: result,
                    files: result.files || {},
                    buildSteps: result.buildSteps || [],
                    runCommands: result.runCommands || []
                  });
                
                // Ensure result is properly formatted before sending
                const formattedResult = typeof result === 'string' ? 
                    { explanation: result } : result;
                
                io.to(socket.roomId).emit('project-message', {
                    message: formattedResult,
                    sender: "BUTO AI"
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


            // Handle regular messages
            socket.broadcast.to(socket.roomId).emit('project-message', {
                message: data.message,
                sender: socket.user.email
            });
        }
    });

    socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => { /* … */ });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});