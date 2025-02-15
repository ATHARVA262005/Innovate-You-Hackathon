import projectModal from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import { validationResult } from 'express-validator';
import userModal from '../models/user.model.js';

export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { name } = req.body;
        const loggedInUser = await userModal.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const newProject = await projectService.createProject({ name, userId });

        res.status(201).json(newProject);
        
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
        
    }
    
}

export const getAllProjects = async (req, res) => {
    try {
        const loggedInUser = await userModal.findOne({ email: req.user.email });
        const userId = loggedInUser._id;
        console.log(userId);

        const AllUserProjects = await projectService.getAllProjectsByUserId({userId});

       return  res.status(200).json({projects: AllUserProjects});
        
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
        
    }
    
}

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { users, projectId } = req.body;
        const loggedInUser = await userModal.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const project = await projectService.addUserToProject({ users, projectId, userId });

        return res.status(200).json(project); 
        
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
        
    }
    
}

export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const project = await projectService.getProjectById({ projectId });

        return res.status(200).json(project);
        
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
        
    }
    
}

export const renameProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { projectId } = req.params;
        const { name } = req.body;
        const loggedInUser = await userModal.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const updatedProject = await projectService.renameProject({ 
            projectId, 
            name, 
            userId 
        });

        return res.status(200).json(updatedProject);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
}

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUser = await userModal.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        await projectService.deleteProject({ 
            projectId, 
            userId 
        });

        return res.status(200).json({ 
            message: 'Project deleted successfully',
            deletedProjectId: projectId 
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
}