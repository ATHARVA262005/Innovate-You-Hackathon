import {  useEffect, useState } from "react";
import {
  AiOutlinePlus,
  AiOutlineClose,
  AiOutlineEdit,
  AiOutlineDelete,
} from "react-icons/ai";
import { BsBookmarkStar } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'rename'
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0); // New state for bookmark count

  const navigate = useNavigate();

  const handleModal = (mode, project = null) => {
    setModalMode(mode);
    setSelectedProject(project);
    if (mode === "rename" && project) {
      setProjectName(project.name);
    } else {
      setProjectName("");
    }
    setIsModalOpen(true);
  };

  const handleProjectAction = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const actions = {
      create: () => axios.post("/projects/create", { name: projectName }),
      rename: () =>
        axios.put(`/projects/${selectedProject._id}/rename`, {
          name: projectName,
        }),
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
        setProjectName("");
        setSelectedProject(null);
      });
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    setIsLoading(true);
    try {
      await axios.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (error) {
      console.error(error);
      alert("Failed to delete project");
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
      alert("Failed to fetch projects");
    } finally {
      setIsLoading(false);
    }
  };

  // New function to fetch bookmark count
  const fetchBookmarkCount = async () => {
    try {
      const response = await axios.get("/bookmarks/count");
      setBookmarkCount(response.data.count);
    } catch (error) {
      console.error("Failed to fetch bookmark count:", error);
      // Don't show alert for this as it's not critical
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchBookmarkCount(); // Fetch bookmark count on component mount
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
              onClick={() => handleModal("create")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-blue-500/20"
              disabled={isLoading}
            >
              <AiOutlinePlus className="text-xl" />
              New Project
            </button>

            <button
              onClick={() => navigate("/bookmarks")}
              className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-gray-500/20 hover:text-blue-400 relative group"
              title="Bookmarks"
            >
              <BsBookmarkStar className="text-xl" />
              <span className="absolute -top-2 -right-2 bg-blue-500 text-xs text-white px-2 py-1 rounded-full">
                {bookmarkCount}
              </span>
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-gray-500/20 hover:text-blue-400 relative"
              title="Profile"
            >
              <FaUserCircle className="text-xl" />
            </button>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all duration-200 group shadow-lg hover:shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {project.name}
                </h2>
                <span className="text-white flex gap-2 justify-center items-center bg-gray-700 px-3 py-1 rounded-full">
                  <FaUserCircle className="text-blue-400" />{" "}
                  {project.users.length}
                </span>
              </div>

              {/* Enhanced Horizontal Line */}
              <hr className="border-gray-600 my-4 opacity-50" />

              <div className="flex justify-between items-center">
                <button
                  onClick={() => navigateToProject(project)}
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 hover:underline"
                >
                  Open Project
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModal("rename", project);
                    }}
                    className="text-gray-400 hover:text-white transition-all duration-200 p-2 hover:bg-gray-600 rounded-lg"
                    disabled={isLoading}
                  >
                    <AiOutlineEdit size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project._id);
                    }}
                    className="text-red-400 hover:text-red-300 transition-all duration-200 p-2 hover:bg-gray-600 rounded-lg"
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
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {modalMode === "create"
                    ? "Create New Project"
                    : "Rename Project"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
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
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-blue-500/20"
                  disabled={isLoading}
                >
                  {modalMode === "create" ? "Create Project" : "Rename Project"}
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
