import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaBookmark,
  FaMobileAlt,
  FaChevronLeft,
} from "react-icons/fa";
import axios from "../config/axios";

const BookmarkPage = () => {
  const [bookmarkedProjects, setBookmarkedProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [bookmarkedMessages, setBookmarkedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const [bookmarkError, setBookmarkError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showMessagesOnMobile, setShowMessagesOnMobile] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  // Fetch bookmarked projects with debounce to prevent excessive calls
  const fetchBookmarkedProjects = useCallback(async () => {
    try {
      setLoading(true);
      setProjectsError(null);
      const response = await axios.get("/bookmarks/projects/bookmarked");
      console.log("Bookmarked Projects from API:", response.data);

      // Ensure unique projects by filtering out duplicates
      const uniqueProjects = Array.from(
        new Map(response.data.map((project) => [project._id, project])).values()
      );

      setBookmarkedProjects(uniqueProjects);
    } catch (err) {
      setProjectsError(
        "Failed to fetch bookmarked projects. Please try again later."
      );
      console.error("Failed to fetch bookmarked projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarkedProjects();
  }, [fetchBookmarkedProjects]);

  const handleProjectClick = useCallback(async (projectId, projectName) => {
    try {
      setMessagesLoading(true);
      setMessagesError(null);
      setShowMessagesOnMobile(true);
      setSelectedProjectName(projectName);

      const response = await axios.get(
        `/bookmarks/projects/${projectId}/bookmarked-messages`
      );
      console.log("Bookmarked Messages from API:", response.data);

      setSelectedProject(projectId);
      setBookmarkedMessages(response.data);

      // Update the project count in the bookmarkedProjects array
      setBookmarkedProjects((prev) =>
        prev.map((project) =>
          project._id === projectId
            ? { ...project, bookmarkCount: response.data.length }
            : project
        )
      );
    } catch (err) {
      setMessagesError(
        "Failed to fetch bookmarked messages. Please try again later."
      );
      console.error("Failed to fetch bookmarked messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const initiateDeleteBookmark = (messageId, messageContent) => {
    // Store the message ID to delete along with a preview of its content
    const preview =
      typeof messageContent === "string"
        ? messageContent.substring(0, 30) +
          (messageContent.length > 30 ? "..." : "")
        : "this message";

    setConfirmDelete({
      messageId,
      preview,
    });
  };

  const cancelDeleteBookmark = () => {
    setConfirmDelete(null);
  };

  const confirmDeleteBookmark = async () => {
    if (!confirmDelete || !selectedProject) return;

    const messageId = confirmDelete.messageId;

    try {
      setBookmarkError(null);

      const response = await axios.delete(
        `/bookmarks/projects/${selectedProject}/messages/${messageId}/bookmark`
      );

      console.log("Bookmark removal response:", response.data);

      // Update UI after successful removal
      setBookmarkedMessages((prevMessages) =>
        prevMessages.filter((message) => message._id !== messageId)
      );

      // Update the count in the project list
      setBookmarkedProjects((prev) =>
        prev.map((project) =>
          project._id === selectedProject
            ? { ...project, bookmarkCount: (project.bookmarkCount || 1) - 1 }
            : project
        )
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to remove bookmark. Please try again.";
      setBookmarkError(errorMessage);
      console.error("Failed to remove bookmark:", err);
      console.error("Error details:", err.response?.data);

      // Auto-clear error after 5 seconds
      setTimeout(() => setBookmarkError(null), 5000);
    } finally {
      setConfirmDelete(null); // Close the confirmation dialog
    }
  };

  const handleBackToProjects = () => {
    setShowMessagesOnMobile(false);
  };

  // Memoize filtered projects for performance
  const filteredProjects = useMemo(() => {
    return bookmarkedProjects.filter((project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bookmarkedProjects, searchTerm]);

  const renderEmptyProjectsState = () => (
    <div className="flex flex-col items-center justify-center text-center h-64 p-6">
      <div className="mb-4 text-gray-500">
        <FaBookmark className="w-16 h-16 mx-auto" />
      </div>

      <h3 className="text-lg font-medium mb-2">No bookmarked projects yet</h3>

      <p className="text-sm text-gray-400 mb-4">
        When you bookmark messages in a project, they'll appear here for quick
        reference.
      </p>

      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors"
        aria-label="Go to projects"
      >
        Start exploring projects
      </button>
    </div>
  );

  const renderEmptyMessagesState = () => (
    <div className="flex flex-col items-center justify-center text-center h-64 p-6">
      <div className="mb-4 text-gray-500">
        <FaBookmark className="w-16 h-16 mx-auto" />
      </div>

      <h3 className="text-lg font-medium mb-2">No bookmarked messages</h3>

      <p className="text-sm text-gray-400 mb-4">
        You haven't bookmarked any messages in this project yet. Click the
        bookmark icon next to any message to save it for later.
      </p>
    </div>
  );

  const renderNoSelectionState = () => (
    <div className="flex flex-col items-center justify-center text-center h-64 p-6">
      <div className="mb-4 text-gray-500">
        <FaArrowLeft className="w-12 h-12 mx-auto" />
      </div>

      <h3 className="text-lg font-medium mb-2">Select a project</h3>

      <p className="text-sm text-gray-400">
        Choose a project from the left to view your bookmarked messages.
      </p>
    </div>
  );

  // Deletion confirmation dialog
  const renderConfirmationDialog = () => {
    if (!confirmDelete) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
          <h3 className="text-lg font-medium mb-3">Confirm Delete</h3>
          <p className="text-gray-300 mb-4">
            Are you sure you want to remove the bookmark for "
            {confirmDelete.preview}"?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={cancelDeleteBookmark}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteBookmark}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-900 text-white overflow-hidden">
      {/* Projects Panel - Hidden on mobile when viewing messages */}
      <div
        className={`w-full lg:w-[35%] border-r border-gray-700 flex flex-col h-full ${
          showMessagesOnMobile ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Go back to main page"
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
              aria-label="Search projects"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center text-gray-400">
              <FaSpinner
                className="h-6 w-6 animate-spin mr-2"
                aria-hidden="true"
              />
              <span>Loading projects...</span>
            </div>
          ) : projectsError ? (
            <div
              className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-md"
              role="alert"
            >
              {projectsError}
              <button
                className="block mt-2 text-xs underline"
                onClick={fetchBookmarkedProjects}
              >
                Try again
              </button>
            </div>
          ) : filteredProjects.length > 0 ? (
            <ul
              className="space-y-2"
              role="list"
              aria-label="Bookmarked projects"
            >
              {filteredProjects.map((project) => (
                <li
                  key={project._id}
                  className={`${
                    selectedProject === project._id
                      ? "bg-blue-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  } p-3 rounded-lg cursor-pointer transition-colors duration-200`}
                  onClick={() => handleProjectClick(project._id, project.name)}
                  role="button"
                  aria-selected={selectedProject === project._id}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">
                      {project.name}
                    </span>
                    {/* Always show count - will be fetched when project is clicked */}
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                      {project.bookmarkCount || 0}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : searchTerm ? (
            <div className="text-center text-gray-500 mt-8">
              No matching projects found.
            </div>
          ) : (
            renderEmptyProjectsState()
          )}
        </div>
      </div>

      {/* Messages Panel - Shown on mobile when a project is selected */}
      <div
        className={`w-full lg:w-[65%] flex-col ${
          showMessagesOnMobile ? "flex" : "hidden lg:flex"
        }`}
      >
        <div className="p-4 border-b border-gray-700 shrink-0 flex items-center">
          {/* Back button - only visible on mobile */}
          <button
            onClick={handleBackToProjects}
            className="lg:hidden p-2 mr-2 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Back to projects"
          >
            <FaChevronLeft className="h-4 w-4" />
          </button>

          <h2 className="text-lg font-semibold flex-1">
            {selectedProject
              ? `${selectedProjectName}: Bookmarked Messages (${bookmarkedMessages.length})`
              : "Bookmarked Messages"}
          </h2>
        </div>

        {/* Show bookmark error if there is one */}
        {bookmarkError && (
          <div className="p-4">
            <div
              className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-md text-sm"
              role="alert"
            >
              {bookmarkError}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center text-gray-400">
              <FaSpinner
                className="h-6 w-6 animate-spin mr-2"
                aria-hidden="true"
              />
              <span>Loading messages...</span>
            </div>
          ) : messagesError ? (
            <div
              className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-md"
              role="alert"
            >
              {messagesError}
              <button
                className="block mt-2 text-xs underline"
                onClick={() =>
                  selectedProject &&
                  handleProjectClick(selectedProject, selectedProjectName)
                }
              >
                Try again
              </button>
            </div>
          ) : selectedProject ? (
            bookmarkedMessages.length > 0 ? (
              <ul
                className="space-y-3"
                role="list"
                aria-label="Bookmarked messages"
              >
                {bookmarkedMessages.map((message) => (
                  <li
                    key={message._id}
                    className="bg-gray-800 hover:bg-gray-750 p-4 rounded-lg transition-colors duration-200 group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        {/* Handle different message types */}
                        {message.isAiResponse ? (
                          <div className="text-sm text-gray-200">
                            <div className="text-xs text-indigo-400 mb-1">
                              AI Response
                            </div>
                            {message.explanation && (
                              <div className="mb-2 whitespace-pre-wrap">
                                {message.explanation.length > 300
                                  ? `${message.explanation.substring(
                                      0,
                                      300
                                    )}...`
                                  : message.explanation}
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
                          <>
                            <div className="text-xs text-green-400 mb-1">
                              User Message
                            </div>
                            <p className="text-sm text-gray-200 whitespace-pre-wrap">
                              {typeof message.message === "string"
                                ? message.message.length > 300
                                  ? `${message.message.substring(0, 300)}...`
                                  : message.message
                                : message.message?.explanation
                                ? message.message.explanation.length > 300
                                  ? `${message.message.explanation.substring(
                                      0,
                                      300
                                    )}...`
                                  : message.message.explanation
                                : "No content available"}
                            </p>
                          </>
                        )}
                        <div className="text-xs text-gray-400 mt-2 flex justify-between">
                          <span>
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                          {message.tags && message.tags.length > 0 && (
                            <div className="text-xs space-x-1">
                              {message.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="bg-blue-900/40 px-1.5 py-0.5 rounded-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          initiateDeleteBookmark(
                            message._id,
                            message.isAiResponse
                              ? message.explanation
                              : message.message
                          )
                        }
                        className="p-2 text-gray-500 hover:bg-gray-600 hover:text-red-400 rounded-full transition-colors opacity-60 group-hover:opacity-100"
                        aria-label="Remove bookmark"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              renderEmptyMessagesState()
            )
          ) : (
            renderNoSelectionState()
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {renderConfirmationDialog()}
    </div>
  );
};

export default BookmarkPage;
