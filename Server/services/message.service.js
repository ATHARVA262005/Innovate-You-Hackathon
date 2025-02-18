// Server/services/message.service.js
import Message from "../models/message.model.js";

export const saveMessage = async (messageData) => {
  try {
    // For AI messages with files
    if (messageData.sender === "BUTO AI") {
      messageData.isAiResponse = true;
      
      // Handle message content
      if (typeof messageData.message === 'object') {
        messageData.explanation = messageData.message.explanation;
        
        if (messageData.message.files) {
          messageData.hasGeneratedFiles = true;
          messageData.files = Object.entries(messageData.message.files).map(
            ([name, content]) => ({
              name,
              content,
            })
          );
        }
      }
    }

    const message = new Message(messageData);
    await message.save();
    return {
      ...message.toObject(),
      _id: message._id.toString(),
    };
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

export const getProjectMessages = async (projectId) => {
  try {
    const messages = await Message.find({ projectId }).sort({ timestamp: 1 });

    // Transform messages for client
    return messages.map((msg) => {
      const messageObj = {
        ...msg.toObject(),
        timestamp: msg.timestamp.getTime(),
      };

      // For AI messages with files
      if (msg.hasGeneratedFiles) {
        messageObj.message = {
          explanation: msg.explanation,
          files: msg.files.reduce((acc, file) => {
            acc[file.name] = file.content;
            return acc;
          }, {}),
        };
      }

      return messageObj;
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    throw error;
  }
};

export const getProjectFileHistory = async (projectId) => {
  try {
    const messages = await Message.find({
      projectId,
      hasGeneratedFiles: true,
    }).sort({ timestamp: -1 });

    return messages.map((msg) => ({
      timestamp: msg.timestamp.getTime(),
      files: msg.files.reduce((acc, file) => {
        acc[file.name] = file.content;
        return acc;
      }, {}),
      buildSteps: msg.buildSteps || [],
      runCommands: msg.runCommands || [],
      prompt: msg.prompt || null, // Include prompt in history
    }));
  } catch (error) {
    console.error("Error getting file history:", error);
    throw error;
  }
};
