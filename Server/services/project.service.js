import ProjectModel from "../models/project.model.js";
import UserModel from "../models/user.model.js";
import mongoose from 'mongoose';


export const createProject = async ({name, userId}) => {
    if (!name) {
        throw new Error('Name is required');
    }
    if (!userId) {
        throw new Error('User ID is required');
    }

    let project;
    try {
        project = await ProjectModel.create({
            name,
            users: [userId]
        });
    } catch (error) {
        if (error.code === 11000) { 
            throw new Error('Project name already exists');
        }
        throw error;
    }

    return project;

}

export const getAllProjectsByUserId = async ({userId}) => {

    if (!userId) {
        throw new Error('User ID is required');
    }

    const AllUserProjects = await ProjectModel.find({ users: userId });

    return AllUserProjects;

}

export const addUserToProject = async ({users, projectId, userId}) => {
    if (!users) {
        throw new Error('Users are required');
    }
    if (!projectId) {
        throw new Error('Project ID is required');
    }
    if (!userId) {
        throw new Error('User ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid Project ID');
    }

    const project = await ProjectModel.findOne({ 
        _id: projectId,
        users: userId 
    });
    
    if (!project) {
        throw new Error('User not authorized to add users to project');
    }

    const collaborators = await UserModel.find({ 
        email: { $in: users }
    });

    const existingEmails = collaborators.map(user => user.email);
    const nonExistentEmails = users.filter(email => !existingEmails.includes(email));

    if (nonExistentEmails.length > 0) {
        throw new Error(`Users not found with emails: ${nonExistentEmails.join(', ')}`);
    }

    const collaboratorIds = collaborators.map(user => user._id);

    const updatedProject = await ProjectModel.findOneAndUpdate(
        { _id: projectId },
        { $addToSet: { users: { $each: collaboratorIds } } },
        { new: true }
    ).populate('users');

    return updatedProject;
}

export const getProjectById = async ({projectId}) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid Project ID');
    }

    const project = await ProjectModel.findOne({ _id: projectId }).populate('users');

    return project;

}