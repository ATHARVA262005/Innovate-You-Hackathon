import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true // This ensures each message gets an ID
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'project',
    required: true
  },
  sender: {
    type: String,
    required: true
  },
  message: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  files: [{
    name: String,
    content: String
  }],
  explanation: String,  // Add this field to store AI explanation
  buildSteps: [String],
  runCommands: [String],
  prompt: {
    type: String,
    default: null
  },
  isAiResponse: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  hasGeneratedFiles: {
    type: Boolean,
    default: false
  }
});

const Message = mongoose.model('message', messageSchema);
export default Message;