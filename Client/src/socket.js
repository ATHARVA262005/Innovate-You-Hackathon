import { io } from 'socket.io-client';
import { getToken } from './services/auth.service';

export const initializeSocket = (projectId) => {
    const socket = io(import.meta.env.VITE_SERVER_URL, {
        auth: {
            token: getToken()
        },
        query: {
            projectId
        }
    });

    return socket;
};
