import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/user.context";
import { AiOutlinePlus, AiOutlineClose, AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FaUserAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";

const Home = () => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'rename'
    const [projectName, setProjectName] = useState('');
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleModal = (mode, project = null) => {
        setModalMode(mode);
        setSelectedProject(project);
        if (mode === 'rename' && project) {
            setProjectName(project.name);
        } else {
            setProjectName('');
        }
        setIsModalOpen(true);
    };

    const handleProjectAction = (e) => {
        e.preventDefault();
        setIsLoading(true);

        const actions = {
            create: () => axios.post("/projects/create", { name: projectName }),
            rename: () => axios.put(`/projects/${selectedProject._id}/rename`, { name: projectName })
        };

        actions[modalMode]()
            .then(() => {
                setIsModalOpen(false);
                fetchProjects();
            })
            .catch((error) => {
                console.error(error);
                alert(`Failed to ${modalMode} project`);
            })
            .finally(() => {
                setIsLoading(false);
                setProjectName('');
                setSelectedProject(null);
            });
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;

        setIsLoading(true);
        try {
            await axios.delete(`/projects/${projectId}`);
            fetchProjects();
        } catch (error) {
            console.error(error);
            alert('Failed to delete project');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/projects/all");
            setProjects(response.data.projects);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch projects');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const navigateToProject = (project) => {
        navigate("/project", { state: { project } });
    };

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">BUTO.ai</h1>
                    
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleModal('create')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            <AiOutlinePlus className="text-xl" />
                            New Project
                        </button>

                        <button 
                            onClick={() => navigate("/profile")} 
                            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
                        >
                            <FaUserAlt className="text-2xl" />
                        </button>
                    </div>
                </div>

                {/* Project Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {projects.map((project) => (
                        <div 
                            key={project._id} 
                            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors group"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-white">{project.name}</h2>
                                <span className="text-white flex gap-2 justify-center items-center">
                                    <FaUserAlt /> {project.users.length}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => navigateToProject(project)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Open Project
                                </button>
                                
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleModal('rename', project);
                                        }}
                                        className="text-gray-400 hover:text-white transition-colors p-2"
                                        disabled={isLoading}
                                    >
                                        <AiOutlineEdit size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project._id);
                                        }}
                                        className="text-red-400 hover:text-red-300 transition-colors p-2"
                                        disabled={isLoading}
                                    >
                                        <AiOutlineDelete size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal for Create/Rename Project */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-white">
                                    {modalMode === 'create' ? 'Create New Project' : 'Rename Project'}
                                </h2>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <AiOutlineClose size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleProjectAction}>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="Enter project name"
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <button 
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {modalMode === 'create' ? 'Create Project' : 'Rename Project'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;