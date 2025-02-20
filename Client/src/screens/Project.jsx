import React, {
  useState,
  useEffect,
  useContext,
  createRef,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaTimes,
  FaArrowLeft,
  FaArrowDown,
  FaHistory,
  FaCopy,
  FaCheck,
  FaColumns,
} from "react-icons/fa";
import { BsBookmarkStar } from "react-icons/bs";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import { UserContext } from "../context/user.context";
import { IoSend, IoCodeOutline } from "react-icons/io5";
import Markdown from "markdown-to-jsx";

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);

      // hljs won't reprocess the element unless this attribute is removed
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

const Project = () => {
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAddCollaboratorModal, setShowAddCollaboratorModal] =
    useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [showCodeDrawer, setShowCodeDrawer] = useState(false);
  const [error, setError] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [fileHistory, setFileHistory] = useState([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showProjectBookmarks, setShowProjectBookmarks] = useState(false);
  const [bookmarkedMessages, setBookmarkedMessages] = useState([]);
  const projectId = location.state.project._id;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const { user } = useContext(UserContext);
  const messageBox = createRef();
  const [showScrollButton, setShowScrollButton] = useState(true); // Set initial state to true
  const [generatedFiles, setGeneratedFiles] = useState({});
  const [buildSteps, setBuildSteps] = useState([]);
  const [runCommands, setRunCommands] = useState([]);
  const [activeChat, setActiveChat] = useState("team"); // 'team' or 'ai'
  const [splitView, setSplitView] = useState(false);

  const fetchProjectBookmarkedMessages = async () => {
    try {
      const response = await axios.get(
        `/bookmarks/projects/${projectId}/bookmarked-messages`
      );
      setBookmarkedMessages(response.data);
    } catch (err) {
      console.error("Failed to fetch bookmarked messages:", err);
    }
  };

  const send = async () => {
    if (!messageText.trim()) return;

    try {
      // Determine if this is an AI message based on active chat
      const isAiMessage = activeChat === "ai";

      // Format message with AI prefix if needed
      const formattedMessage =
        isAiMessage && !messageText.toLowerCase().includes("@ai")
          ? `@ai ${messageText}`
          : messageText;

      // Send to server first and get the saved message with ID
      const savedMessage = await axios.post("/messages/save", {
        projectId,
        sender: user.email,
        message: formattedMessage,
        fromUser: true,
        isAiTargeted: isAiMessage,
        timestamp: new Date().getTime(),
      });

      // Add message to local state with the server-generated ID
      const newMessage = {
        _id: savedMessage.data._id,
        sender: user.email,
        message: formattedMessage,
        fromUser: true,
        isAiTargeted: isAiMessage,
        timestamp: new Date().getTime(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // Send through socket with the message ID
      sendMessage("project-message", {
        _id: savedMessage.data._id,
        message: formattedMessage,
        sender: user._id,
        projectId: projectId,
        isAiTargeted: isAiMessage,
      });

      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleScroll = () => {
    if (messageBox.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageBox.current;
      // Show button if we're not at the bottom (with a larger threshold)
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (messageBox.current) {
      messageBox.current.scrollTop = messageBox.current.scrollHeight;
      setShowScrollButton(false); // Hide button after scrolling
    }
  };

  function WriteAiMessage(message) {
    console.log("Message:", message.explanation);

    return (
      <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
        <Markdown
          children={message.explanation}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    );
  }

  const handleAIResponse = (data) => {
    try {
      const response =
        typeof data.message === "string"
          ? JSON.parse(data.message)
          : data.message;

      // Create message object with files if present
      const messageObj = {
        _id: data._id,
        sender: "BUTO AI",
        message: (
          <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
            <Markdown
              children={response.explanation}
              options={{
                overrides: {
                  code: SyntaxHighlightedCode,
                },
              }}
            />
          </div>
        ),
        fromUser: false,
        isAI: true,
        timestamp: new Date().getTime(),
      };

      console.log("AI Message Object:", messageObj);

      // If there are files, add to file history
      if (response.files && Object.keys(response.files).length > 0) {
        messageObj.hasFiles = true;
        messageObj.files = response.files;

        // Update file history
        setFileHistory((prev) => [
          {
            files: response.files,
            timestamp: new Date().getTime(),
            buildSteps: response.buildSteps || [],
            runCommands: response.runCommands || [],
          },
          ...prev,
        ]);
      }

      // Add files to message object if present
      if (response.files && Object.keys(response.files).length > 0) {
        messageObj.hasFiles = true;
        messageObj.files = response.files;
        messageObj.buildSteps = response.buildSteps || [];
        messageObj.runCommands = response.runCommands || [];
      }

      setMessages((prev) => [...prev, messageObj]);

      // If there are files, update the current view
      if (response.files && Object.keys(response.files).length > 0) {
        setGeneratedFiles(response.files);
        const firstFileName = Object.keys(response.files)[0];
        setSelectedFile({
          name: firstFileName,
          content: response.files[firstFileName],
          isGenerated: true,
        });
      }

      // Handle build steps
      if (response.buildSteps && response.buildSteps.length > 0) {
        setBuildSteps(response.buildSteps);
        setMessages((prev) => [
          ...prev,
          {
            sender: "BUTO AI",
            message: (
              <div className="bg-slate-900 p-2 rounded">
                <h3 className="font-bold mb-2">Build Steps:</h3>
                <ol className="list-decimal pl-5">
                  {response.buildSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            ),
            fromUser: false,
            isBuildSteps: true,
            timestamp: new Date().getTime(),
          },
        ]);
      }

      // Handle run commands
      if (response.runCommands && response.runCommands.length > 0) {
        setRunCommands(response.runCommands);
        setMessages((prev) => [
          ...prev,
          {
            sender: "BUTO AI",
            message: (
              <div className="bg-slate-900 p-2 rounded">
                <h3 className="font-bold mb-2">Run Commands:</h3>
                <ul className="list-disc pl-5">
                  {response.runCommands.map((cmd, idx) => (
                    <li key={idx} className="font-mono">
                      {cmd}
                    </li>
                  ))}
                </ul>
              </div>
            ),
            fromUser: false,
            isRunCommands: true,
            timestamp: new Date().getTime(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error processing AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "BUTO AI",
          message: "Error processing the response",
          isError: true,
          timestamp: new Date().getTime(),
        },
      ]);
    }
  };

  const handleFileIconClick = (messageFiles) => {
    setGeneratedFiles(messageFiles);
    const firstFileName = Object.keys(messageFiles)[0];
    setSelectedFile({
      name: firstFileName,
      content: messageFiles[firstFileName],
      isGenerated: true,
    });
  };

  const handleCopyCode = async () => {
    if (selectedFile) {
      try {
        await navigator.clipboard.writeText(selectedFile.content);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
  };

  useEffect(() => {
    const socket = initializeSocket(projectId);

    receiveMessage("project-message", (data) => {
      if (data.sender === "BUTO AI") {
        handleAIResponse({
          ...data,
          _id: data._id, // Message ID is now available here
        });
      } else {
        setMessages((prev) => [
          ...prev,
          {
            ...data,
            _id: data._id, // Message ID is available for regular messages
            sender: data.sender,
            message: data.message,
            fromUser: false,
            timestamp: data.timestamp,
          },
        ]);
      }
    });

    return () => {
      if (socket && typeof socket.disconnect === "function") {
        socket.disconnect();
      }
    };
  }, [projectId]);

  useEffect(() => {
    const currentMessageBox = messageBox.current;
    if (currentMessageBox) {
      currentMessageBox.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (currentMessageBox) {
        currentMessageBox.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await axios.get(
          `/projects/get-project/${location.state.project._id}`
        );
        if (response.data) {
          setCollaborators(response.data.users);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch project collaborators");
      } finally {
        setLoading(false);
      }
    };

    if (location.state?.project?._id) {
      fetchProjectData();
    }
  }, [location.state?.project?._id]);

  // Add this new effect to check scroll position when messages change
  useEffect(() => {
    if (messageBox.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageBox.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isAtBottom);
    }
  }, [messages]);

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put("/projects/add-user", {
        projectId: location.state.project._id,
        users: [newCollaboratorEmail],
      });

      if (response.data) {
        setShowAddCollaboratorModal(false);
        setNewCollaboratorEmail("");
        // You can add state update here to refresh collaborators list
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Failed to add collaborator");
    }
  };

  // Replace the loadProjectHistory effect with this simpler version that only loads file history
  useEffect(() => {
    const loadFileHistory = async () => {
      try {
        const historyRes = await axios.get(
          `/messages/${projectId}/file-history`
        );
        setFileHistory(historyRes.data.fileHistory);
      } catch (error) {
        console.error("Error loading file history:", error);
      }
    };

    loadFileHistory();
  }, [projectId]);

  const renderFileHistory = () => (
    <div className="flex-1 overflow-y-auto p-4">
      {fileHistory.map((entry, index) => (
        <div key={index} className="mb-4">
          <div className="text-sm text-gray-400 mb-2">
            {new Date(entry.timestamp).toLocaleString()}
          </div>
          {Object.entries(entry.files).map(([filename, content]) => (
            <div
              key={filename}
              className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() =>
                setSelectedFile({
                  name: filename,
                  content,
                  buildSteps: entry.buildSteps,
                  runCommands: entry.runCommands,
                })
              }
            >
              <span className="text-sm text-gray-200">{filename}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  // Inside the renderMessage function, update to display who sent the AI-targeted message
  // Improved renderMessage function with better prompt indicator and icon placement
  const renderMessage = (msg, index) => {
    const isAiMessage =
      typeof msg.message === "string" &&
      msg.message.toLowerCase().includes("@ai");

    return (
      <div
        key={msg._id || index}
        className={`${
          msg.fromUser
            ? "bg-blue-600 ml-auto"
            : msg.isAI
            ? "bg-purple-700"
            : "bg-gray-800"
        } rounded-lg p-3 max-w-[80%] ${
          msg.isSystem ? "text-center mx-auto" : ""
        }`}
      >
        {/* Message header with sender info */}
        <div className="font-semibold text-white flex items-center justify-between mb-1">
          <div className="flex flex-col">
            <span>{msg.sender}</span>

            {/* Add subtle AI prompt indicator without email redundancy */}
            {isAiMessage && !msg.isAI && (
              <span className="text-xs text-purple-300 opacity-75">
                AI prompt
              </span>
            )}
          </div>

          {/* Action buttons container */}
          <div className="flex items-center">
            {msg.hasFiles && (
              <button
                onClick={() => handleFileIconClick(msg.files)}
                className="p-1 hover:bg-purple-600 rounded transition-colors mr-2"
                title="Show generated files"
              >
                <IoCodeOutline size={18} />
              </button>
            )}

            {isAiMessage && msg._id && (
              <button
                onClick={() => toggleMessageBookmark(msg._id)}
                className={`
              p-1.5 rounded-lg
              transform transition-all duration-300
              hover:scale-110
              ${
                msg.isBookmarked
                  ? "bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg shadow-blue-500/30"
                  : "bg-gray-800 hover:bg-gray-700"
              }
            `}
                title="Bookmark Message"
              >
                <BsBookmarkStar
                  size={16}
                  className={`
                transition-all duration-300
                ${
                  msg.isBookmarked
                    ? "text-white animate-pulse"
                    : "text-gray-400 hover:text-blue-400"
                }
              `}
                />
              </button>
            )}
          </div>
        </div>

        {/* Message content */}
        <div
          className={`${
            msg.isCommand ? "font-mono text-sm whitespace-pre" : ""
          }`}
        >
          {/* Format AI prompts */}
          {isAiMessage && !msg.isAI ? (
            <div className="bg-purple-900/30 p-2 rounded-md border-l-2 border-purple-500">
              {typeof msg.message === "string"
                ? msg.message.replace(/^@ai\s*/i, "")
                : msg.message}
            </div>
          ) : (
            msg.message
          )}
        </div>
      </div>
    );
  };

  const renderFileList = () => (
    <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      {Object.keys(generatedFiles).length > 0 ? (
        <ul className="space-y-2">
          {Object.entries(generatedFiles).map(([filename, content]) => (
            <li
              key={filename}
              className={`${
                selectedFile?.name === filename
                  ? "bg-blue-600"
                  : "bg-gray-800 hover:bg-gray-700"
              } p-3 rounded-lg cursor-pointer transition-colors duration-200`}
              onClick={() =>
                setSelectedFile({ name: filename, content, isGenerated: true })
              }
            >
              <span className="text-sm text-gray-200">{filename}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500">
          No generated files yet. Use @ai to generate code.
        </div>
      )}
    </div>
  );

  // Add mobile file list renderer
  const renderMobileFileList = () => (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
      {Object.entries(generatedFiles).map(([filename, content]) => (
        <div
          key={filename}
          className={`${
            selectedFile?.name === filename
              ? "bg-blue-600"
              : "bg-gray-800 hover:bg-gray-700"
          } px-4 py-2.5 rounded-lg cursor-pointer transition-colors duration-200 flex-shrink-0 flex items-center min-w-[120px] max-w-[120px]`}
          onClick={() => {
            setSelectedFile({ name: filename, content, isGenerated: true });
            setShowCodeDrawer(true);
          }}
        >
          <span className="text-sm text-gray-200 truncate">{filename}</span>
        </div>
      ))}
    </div>
  );

  const renderHistoryDrawer = () => (
    <div
      className={`fixed inset-y-0 left-0 w-full sm:w-[350px] lg:w-[35%] bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        showHistoryDrawer ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold">File History</h3>
        <button
          onClick={() => setShowHistoryDrawer(false)}
          className="p-2 hover:bg-gray-700 rounded-full"
        >
          <FaTimes size={20} />
        </button>
      </div>
      <div
        className="p-4 overflow-y-auto"
        style={{ height: "calc(100vh - 72px)" }}
      >
        {fileHistory.map((entry, index) => (
          <div key={index} className="mb-6">
            <div className="text-sm text-gray-400 mb-2">
              {new Date(entry.timestamp).toLocaleString()}
            </div>
            {entry.message && (
              <div className="bg-gray-900 p-2 rounded mb-2 text-sm">
                <span className="text-gray-400">Message: </span>
                <span className="text-gray-200">{entry.message}</span>
              </div>
            )}
            <div className="space-y-2">
              {Object.entries(entry.files).map(([filename, content]) => (
                <div
                  key={filename}
                  className="bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setSelectedFile({
                      name: filename,
                      content,
                      buildSteps: entry.buildSteps,
                      runCommands: entry.runCommands,
                      message: entry.message, // Include message in selected file info
                    });
                    setShowHistoryDrawer(false);
                  }}
                >
                  <span className="text-sm text-gray-200">{filename}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const toggleMessageBookmark = async (messageId) => {
    console.log("messageId:", messageId); // Debugging log
    console.log("Project ID:", projectId); // Debugging log

    if (!messageId) {
      console.error("messageId is undefined");
      return;
    }
    try {
      const response = await axios.post(
        `/bookmarks/projects/${projectId}/messages/${messageId}/bookmark`
      );
      if (response.data.isBookmarked) {
        // Add bookmark to the list
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id === messageId) {
              return { ...msg, isBookmarked: true };
            }
            return msg;
          })
        );
      } else {
        // Remove bookmark from the list
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id === messageId) {
              return { ...msg, isBookmarked: false };
            }
            return msg;
          })
        );
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-900 text-white overflow-hidden">
      <div className="w-full lg:w-[35%] border-r border-gray-700 flex flex-col h-full">
        <div className="p-4 border-b border-gray-700 flex flex-col shrink-0">
          <div className="flex items-center mb-2">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-700 rounded-full mr-3"
            >
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-xl font-semibold flex-1">Project Chat</h2>
            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="p-2 hover:bg-gray-700 rounded-full mr-2"
            >
              <FaHistory size={20} />
            </button>
            <button
              onClick={() => {
                setShowProjectBookmarks(true);
                fetchProjectBookmarkedMessages();
              }}
              className="p-2 hover:bg-gray-700 rounded-full mr-2"
            >
              <BsBookmarkStar size={20} />
            </button>
            <button
              onClick={() => setShowSidePanel(!showSidePanel)}
              className="p-2 hover:bg-gray-700 rounded-full"
            >
              <FaUsers size={20} />
            </button>
          </div>
          <div className="flex w-full">
            <button
              onClick={() => setActiveChat("team")}
              className={`flex-1 px-4 py-2 rounded-tl-lg rounded-tr-lg transition-colors duration-200 ${
                activeChat === "team"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              Team Chat
            </button>
            <button
              onClick={() => setActiveChat("ai")}
              className={`flex-1 px-4 py-2 ml-2 rounded-tl-lg rounded-tr-lg transition-colors duration-200 ${
                activeChat === "ai"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              AI Assistant
            </button>
            <button
              onClick={() => setSplitView(!splitView)}
              className={`ml-2 p-2 rounded-lg transition-colors duration-200 ${
                splitView
                  ? "bg-gray-700 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
              title={splitView ? "Single View" : "Split View"}
            >
              <FaColumns size={18} />
            </button>
          </div>
        </div>
        <div
          className={`fixed inset-y-0 left-0 w-full sm:w-[350px] lg:w-[35%] bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
            showProjectBookmarks ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Bookmarked Messages</h3>
            <button
              onClick={() => setShowProjectBookmarks(false)}
              className="p-2 hover:bg-gray-700 rounded-full"
            >
              <FaTimes size={20} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto">
            {bookmarkedMessages.length > 0 ? (
              <ul className="space-y-3">
                {bookmarkedMessages.map((message) => (
                  <li
                    key={message._id}
                    className="bg-gray-700 p-3 rounded-lg transition-all duration-300 hover:bg-gray-600"
                  >
                    <div className="text-sm text-gray-200">
                      {message.message}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(message.timestamp).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 mt-10">
                No bookmarked messages in this project.
              </div>
            )}
          </div>
        </div>

        <div className={`relative flex-1 ${splitView ? "flex" : ""}`}>
          {/* Team Chat */}
          <div
            className={`${
              !splitView && activeChat !== "team" ? "hidden" : ""
            } ${
              splitView ? "w-1/2 border-r border-gray-700" : "w-full"
            } relative h-full`}
          >
            <div className="absolute top-0 left-0 w-full py-1 px-3 bg-blue-600 bg-opacity-20 text-center text-xs text-blue-300">
              Team Chat
            </div>
            <div
              ref={messageBox}
              className="absolute inset-0 pt-6 overflow-y-auto p-4 space-y-4 scroll-smooth overflow-x-hidden"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#4B5563 #1F2937",
                height: "calc(100vh - 180px)",
              }}
            >
              {messages
                .filter(
                  (msg) =>
                    // Exclude AI responses
                    !msg.isAI &&
                    // Exclude AI command outputs (build steps, run commands)
                    !msg.isBuildSteps &&
                    !msg.isRunCommands &&
                    // Exclude messages with @ai prefix
                    (typeof msg.message !== "string" ||
                      !msg.message.toLowerCase().includes("@ai"))
                )
                .map((msg, index) => renderMessage(msg, index))}

              {showScrollButton && activeChat === "team" && !splitView && (
                <button
                  onClick={scrollToBottom}
                  className="fixed bottom-20 left-4 bg-blue-600 p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 z-30"
                  aria-label="Scroll to bottom"
                >
                  <FaArrowDown className="text-white" size={20} />
                </button>
              )}
            </div>
          </div>

          {/* AI Chat */}
          <div
            className={`${!splitView && activeChat !== "ai" ? "hidden" : ""} ${
              splitView ? "w-1/2" : "w-full"
            } relative h-full`}
          >
            <div className="absolute top-0 left-0 w-full py-1 px-3 bg-purple-600 bg-opacity-20 text-center text-xs text-purple-300">
              AI Assistant
            </div>
            <div
              className="absolute inset-0 pt-6 overflow-y-auto p-4 space-y-4 scroll-smooth overflow-x-hidden"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#4B5563 #1F2937",
                height: "calc(100vh - 180px)",
              }}
            >
              {messages
                .filter(
                  (msg) =>
                    msg.isAI ||
                    (typeof msg.message === "string" &&
                      msg.message.toLowerCase().includes("@ai"))
                )
                .map((msg, index) => renderMessage(msg, index))}

              {showScrollButton && activeChat === "ai" && !splitView && (
                <button
                  onClick={scrollToBottom}
                  className="fixed bottom-20 left-4 bg-purple-600 p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-200 z-30"
                  aria-label="Scroll to bottom"
                >
                  <FaArrowDown className="text-white" size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-700 bg-gray-900 shrink-0 z-20">
          <div className="flex space-x-2">
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              type="text"
              placeholder={`Type your message to ${
                activeChat === "team" ? "the team" : "AI assistant"
              }...`}
              className={`flex-1 bg-gray-800 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                activeChat === "team"
                  ? "border-blue-500 focus:border-blue-500 focus:ring-blue-500"
                  : "border-purple-500 focus:border-purple-500 focus:ring-purple-500"
              }`}
            />
            <button
              onClick={send}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeChat === "team"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              <IoSend />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400 text-center">
            {activeChat === "team"
              ? "Messages here are visible to all team members"
              : "Direct conversation with the AI assistant"}
          </div>
        </div>
        <div className="lg:hidden border-t border-gray-700 bg-gray-900 shrink-0 pb-safe">
          <div className="p-3">
            <h2 className="text-lg font-semibold mb-2">Generated Files</h2>
            {Object.keys(generatedFiles).length > 0 ? (
              renderMobileFileList()
            ) : (
              <>
                <div className="text-center text-gray-500 py-2">
                  No generated files yet. Use @ai to generate code.
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @supports (-webkit-touch-callout: none) {
          .pb-safe {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>

      <div className="hidden lg:flex w-1/5 border-r border-gray-700 flex-col">
        <div className="p-4 border-b border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold">Generated Files</h2>
        </div>
        {renderFileList()}
      </div>

      <div className="hidden lg:flex w-[45%] flex-col">
        <div className="p-4 border-b border-gray-700 shrink-0 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {selectedFile ? selectedFile.name : "Select a file to preview"}
          </h2>
          {selectedFile && (
            <button
              onClick={handleCopyCode}
              className="p-2 hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
              title="Copy code"
            >
              {copySuccess ? (
                <>
                  <FaCheck className="text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <FaCopy /> Copy
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {selectedFile ? (
            <pre className="font-mono text-sm bg-gray-800 p-4 rounded-lg whitespace-pre-wrap">
              {selectedFile.content}
            </pre>
          ) : (
            <div className="text-gray-500 text-center mt-10">
              No file selected
            </div>
          )}
        </div>
      </div>

      {showCodeDrawer && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowCodeDrawer(false)}
        />
      )}

      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 w-full bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-40 rounded-t-2xl ${
          showCodeDrawer ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="w-full flex justify-center p-2">
            <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
          </div>

          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedFile ? selectedFile.name : "Select a file to preview"}
            </h2>
            <div className="flex items-center gap-2">
              {selectedFile && (
                <button
                  onClick={handleCopyCode}
                  className="p-2 hover:bg-gray-700 rounded transition-colors"
                  title="Copy code"
                >
                  {copySuccess ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaCopy />
                  )}
                </button>
              )}
              <button
                onClick={() => setShowCodeDrawer(false)}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedFile ? (
              <pre className="font-mono text-sm bg-gray-800 p-4 rounded-lg whitespace-pre-wrap">
                {selectedFile.content}
              </pre>
            ) : (
              <div className="text-gray-500 text-center mt-10">
                No file selected
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-y-0 left-0 w-full sm:w-[350px] lg:w-[35%] bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          showSidePanel ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Collaborators</h3>
          <button
            onClick={() => setShowSidePanel(false)}
            className="p-2 hover:bg-gray-700 rounded-full"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            <li
              className="bg-blue-600 rounded-lg p-3 hover:bg-blue-700 transition-colors duration-200 cursor-pointer flex items-center justify-center"
              onClick={() => setShowAddCollaboratorModal(true)}
            >
              <span className="text-sm text-white font-semibold">
                Add Collaborator +
              </span>
            </li>
            {loading ? (
              <div className="text-center text-gray-400">
                Loading collaborators...
              </div>
            ) : collaborators.length > 0 ? (
              collaborators.map((collaborator, index) => (
                <li
                  key={collaborator._id}
                  className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                >
                  <span className="text-sm text-gray-200">
                    {collaborator.email}
                  </span>
                </li>
              ))
            ) : (
              <div className="text-center text-gray-400">
                No collaborators found
              </div>
            )}
          </ul>
        </div>
      </div>

      {showAddCollaboratorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Collaborator</h3>
              <button
                onClick={() => {
                  setShowAddCollaboratorModal(false);
                  setError("");
                }}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCollaborator}>
              {error && (
                <div className="mb-4 p-2 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
                  {error}
                </div>
              )}
              <input
                type="email"
                placeholder="Enter Collaborator's email"
                value={newCollaboratorEmail}
                onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCollaboratorModal(false)}
                  className="px-6 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 font-medium w-full"
                >
                  Cancel
                </button>
                <button
                  onSubmit={handleAddCollaborator}
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium w-full"
                >
                  Add Collaborator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {renderHistoryDrawer()}
    </div>
  );
};

export default Project;
