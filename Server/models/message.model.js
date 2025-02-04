import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
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
  buildSteps: [String],
  runCommands: [String],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('message', messageSchema);
export default Message;