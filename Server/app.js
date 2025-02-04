import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRotes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import messageRoutes from './routes/message.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

connect();
const app = express();
app.use(cors());
app.use(morgan('dev'));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/users', userRotes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', messageRoutes);

app.get('/test', (req, res) => {
    res.send('testing successfull');
});

export default app;
