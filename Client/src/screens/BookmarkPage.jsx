import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaSearch, FaSpinner } from "react-icons/fa";
import axios from "../config/axios";

const BookmarkPage = () => {
  const [bookmarkedProjects, setBookmarkedProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bookmarkedMessages, setBookmarkedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookmarkedProjects();
  }, []);

  const fetchBookmarkedProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/bookmarks/projects/bookmarked");
      console.log("Bookmarked Projects from API:", response.data);

      // Ensure unique projects by filtering out duplicates
      const uniqueProjects = Array.from(
        new Map(response.data.map((project) => [project._id, project])).values()
      );

      setBookmarkedProjects(uniqueProjects);
    } catch (err) {
      setError("Failed to fetch bookmarked projects. Please try again later.");
      console.error("Failed to fetch bookmarked projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = async (projectId) => {
    try {
      setMessagesLoading(true);
      setError(null);
      const response = await axios.get(
        `/bookmarks/projects/${projectId}/bookmarked-messages`
      );
      console.log("Bookmarked Messages from API:", response.data);
      setSelectedProject(projectId);
      setBookmarkedMessages(response.data);
    } catch (err) {
      setError("Failed to fetch bookmarked messages. Please try again later.");
      console.error("Failed to fetch bookmarked messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const removeBookmark = async (messageId, e) => {
    e.stopPropagation();
    
    if (!selectedProject) {
      setError("Cannot remove bookmark: No project selected");
      return;
    }
    
    try {
      console.log("Removing bookmark for messageId:", messageId, "in project:", selectedProject);
      
      // Use the updated endpoint structure that includes projectId
      const response = await axios.delete(
        `/bookmarks/projects/${selectedProject}/messages/${messageId}/bookmark`
      );
      
      console.log("Bookmark removal response:", response.data);
      
      // Update UI after successful removal
      setBookmarkedMessages((prevMessages) =>
        prevMessages.filter((message) => message._id !== messageId)
      );
      
      // Clear any previous errors
      if (error) setError(null);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                           "Failed to remove bookmark. Please try again.";
      setError(errorMessage);
      console.error("Failed to remove bookmark:", err);
      console.error("Error details:", err.response?.data);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const filteredProjects = bookmarkedProjects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-900 text-white overflow-hidden">
      {/* Projects Panel */}
      <div className="w-full lg:w-[35%] border-r border-gray-700 flex flex-col h-full">
        <div className="p-4 border-b border-gray-700 flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <FaArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-xl font-semibold flex-1">Bookmarked Projects</h2>
        </div>

        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center text-gray-400">
              <FaSpinner className="h-6 w-6 animate-spin mr-2" />
              <span>Loading projects...</span>
            </div>
          ) : error ? (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-md">
              {error}
            </div>
          ) : filteredProjects.length > 0 ? (
            <ul className="space-y-2">
              {filteredProjects.map((project, index) => (
                <div
                  key={project._id || index} // Ensures unique keys
                  className={`${
                    selectedProject === project._id
                      ? "bg-blue-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  } p-3 rounded-lg cursor-pointer transition-colors duration-200`}
                  onClick={() => handleProjectClick(project._id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">
                      {project.name}
                    </span>
                  </div>
                </div>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              {searchTerm
                ? "No matching projects found."
                : "No bookmarked projects found."}
            </div>
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="hidden lg:flex w-[65%] flex-col">
        <div className="p-4 border-b border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold">
            {selectedProject
              ? `Bookmarked Messages (${bookmarkedMessages.length})`
              : "Bookmarked Messages"}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center text-gray-400">
              <FaSpinner className="h-6 w-6 animate-spin mr-2" />
              <span>Loading messages...</span>
            </div>
          ) : selectedProject ? (
            bookmarkedMessages.length > 0 ? (
              <ul className="space-y-3">
                {bookmarkedMessages.map((message) => (
                  <div
                    key={message._id}
                    className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        {/* Handle different message types */}
                        {message.isAiResponse ? (
                          <div className="text-sm text-gray-200">
                            {message.explanation && (
                              <div className="mb-2 whitespace-pre-wrap">
                                {message.explanation}
                              </div>
                            )}
                            {message.files && message.files.length > 0 && (
                              <div className="mt-2 p-2 bg-gray-900 rounded">
                                <div className="text-xs text-gray-400 mb-1">
                                  Generated Files:
                                </div>
                                {message.files.map((file, index) => (
                                  <div
                                    key={index}
                                    className="text-xs text-blue-400"
                                  >
                                    {file.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-200 whitespace-pre-wrap">
                            {typeof message.message === "string"
                              ? message.message
                              : message.message.explanation ||
                                "No content available"}
                          </p>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(message.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => removeBookmark(message._id, e)}
                        className="p-2 hover:bg-gray-600 hover:text-red-400 rounded-full transition-colors"
                        aria-label="Remove bookmark"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                No bookmarked messages for this project.
              </div>
            )
          ) : (
            <div className="text-center text-gray-500 mt-8">
              Select a project to view bookmarked messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarkPage;