import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post('/create', authMiddleware.authUser ,[
    body('name').isString().withMessage('Name is required'),
], projectController.createProject);

router.get('/all', authMiddleware.authUser, projectController.getAllProjects);


router.put('/add-user', authMiddleware.authUser, [
    body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array')
        .custom(users => users.every(email => typeof email === 'string' && /\S+@\S+\.\S+/.test(email)))
        .withMessage('Each user must be a valid email'),
], projectController.addUserToProject);

router.get('/get-project/:projectId', authMiddleware.authUser, projectController.getProjectById);

export default router;