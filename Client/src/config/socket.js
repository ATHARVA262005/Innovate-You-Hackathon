// socket.js
import socket from "socket.io-client";

let socketInstance = null;

export const initializeSocket = (projectId) => {
  socketInstance = socket(import.meta.env.VITE_SOCKET_URL, {
    auth: {
      token: localStorage.getItem("token"),
    },
    query: {
      projectId,
    },
  });

  // Add connection error handling
  socketInstance.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socketInstance;
};

export const receiveMessage = (eventName, cb) => {
  if (!socketInstance) {
    console.error("Socket not initialized");
    return;
  }

  socketInstance.on(eventName, (data) => {
    // Process AI messages that might need parsing
    if (data.sender === "BUTO AI") {
      try {
        // Ensure message ID is preserved when processing the response
        const processedData = {
          ...data,
          _id: data._id, // Preserve the message ID
          message:
            typeof data.message === "string"
              ? JSON.parse(data.message)
              : data.message,
        };
        cb(processedData);
      } catch (error) {
        console.error("Error processing AI message:", error);
        cb(data); // Fall back to original data if parsing fails
      }
    } else {
      // For regular messages, pass through with ID
      cb({
        ...data,
        _id: data._id,
        timestamp: Date.now(),
      });
    }
  });
};

export const sendMessage = (eventName, data) => {
  if (!socketInstance) {
    console.error("Socket not initialized");
    return;
  }

  // Add timestamp to outgoing messages
  const messageData = {
    ...data,
    timestamp: Date.now(),
  };

  socketInstance.emit(eventName, messageData);
};

// Optional: Add cleanup function
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
