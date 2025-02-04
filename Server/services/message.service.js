// Server/services/message.service.js
import Message from '../models/message.model.js';

export const saveMessage = async (messageData) => {
  const message = new Message(messageData);
  await message.save();
  return message;
};

export const getProjectMessages = async (projectId) => {
  const messages = await Message.find({ projectId })
    .sort({ timestamp: 1 });
  return messages;
};