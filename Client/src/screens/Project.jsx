import React, { useState, useEffect, useContext, createRef, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaUsers, FaTimes, FaArrowLeft, FaArrowDown } from 'react-icons/fa';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
import { UserContext } from '../context/user.context';
import { IoSend } from "react-icons/io5";
import Markdown from 'markdown-to-jsx';

function SyntaxHighlightedCode(props) {
  const ref = useRef(null)

  React.useEffect(() => {
      if (ref.current && props.className?.includes('lang-') && window.hljs) {
          window.hljs.highlightElement(ref.current)

          // hljs won't reprocess the element unless this attribute is removed
          ref.current.removeAttribute('data-highlighted')
      }
  }, [ props.className, props.children ])

  return <code {...props} ref={ref} />
}

const Project = () => {
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [showCodeDrawer, setShowCodeDrawer] = useState(false);
  const [error, setError] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const projectId = location.state.project._id;
  
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const { user } = useContext(UserContext);
  const messageBox = createRef();
  const [showScrollButton, setShowScrollButton] = useState(true); // Set initial state to true
  const [generatedFiles, setGeneratedFiles] = useState({});

  const send = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      sender: user.email,
      message: messageText,
      fromUser: true,
      timestamp: new Date().getTime()
    };

    // Add message to local state
    setMessages(prev => [...prev, newMessage]);

    // Send to server
    sendMessage('project-message', {
      message: messageText,
      sender: user._id,
      projectId: projectId
    });

    setMessageText('');
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
    console.log('Message:', message.explanation);

    

    return (
        <div
            className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
        >
            <Markdown
                children={message.explanation}
                options={{
                    overrides: {
                        code: SyntaxHighlightedCode,
                    },
                }}
            />
        </div>)
}

  const handleAIResponse = (data) => {
    try {
      // Add explanation to chat
      if (data.message) {
        setMessages(prev => [...prev, {
          sender: "BUTO AI",
          message: WriteAiMessage(data.message),
          fromUser: false,
          isAI: true,
          timestamp: new Date().getTime()
        }]);
      }

      // Handle generated files
      if (aiResponse.files && Object.keys(aiResponse.files).length > 0) {
        setGeneratedFiles(aiResponse.files);
        
        // Auto-select first file
        const firstFileName = Object.keys(aiResponse.files)[0];
        setSelectedFile({
          name: firstFileName,
          content: aiResponse.files[firstFileName],
          isGenerated: true
        });
      }
    } catch (error) {
      console.error('Error processing AI response:', error);
      setMessages(prev => [...prev, {
        sender: "BUTO AI",
        message: "Error processing the response",
        isError: true,
        timestamp: new Date().getTime()
      }]);
    }
  };

  useEffect(() => {
    const socket = initializeSocket(projectId);

    receiveMessage('project-message', (data) => {
      if (data.sender === "BUTO AI") {
        handleAIResponse(data);
      } else {
        // Handle regular messages
        setMessages(prev => [...prev, {
          sender: data.sender,
          message: data.message,
          fromUser: false,
          timestamp: new Date().getTime()
        }]);
      }
    });

    return () => socket.disconnect();
  }, [projectId]);

  useEffect(() => {
    const currentMessageBox = messageBox.current;
    if (currentMessageBox) {
      currentMessageBox.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (currentMessageBox) {
        currentMessageBox.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    const fetchProjectData = async () => {
      
      try {
        const response = await axios.get(`/projects/get-project/${location.state.project._id}`);
        if (response.data) {
          setCollaborators(response.data.users);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch project collaborators');
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
      const response = await axios.put('/projects/add-user', {
        projectId: location.state.project._id,
        users: [newCollaboratorEmail]
      });

      if (response.data) {
        setShowAddCollaboratorModal(false);
        setNewCollaboratorEmail('');
        // You can add state update here to refresh collaborators list
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || 'Failed to add collaborator');
    }
  };

  const renderMessage = (msg, index) => (
    <div
      key={index}
      className={`${
        msg.fromUser
          ? 'bg-blue-600 ml-auto'
          : msg.isAI
          ? msg.isCommand
            ? 'bg-gray-700'
            : msg.isSystem
            ? 'bg-indigo-800'
            : msg.isError
            ? 'bg-red-600'
            : 'bg-purple-700'
          : 'bg-gray-800'
      } rounded-lg p-3 max-w-[80%] ${msg.isSystem ? 'text-center mx-auto' : ''}`}
    >
      <div className={`font-semibold ${
        msg.fromUser 
          ? 'text-white' 
          : msg.isAI 
          ? msg.isCommand 
            ? 'text-gray-300'
            : msg.isSystem
            ? 'text-indigo-200'
            : 'text-purple-200' 
          : 'text-blue-400'
      }`}>
        {msg.sender}
      </div>
      <div className={`mt-1 ${msg.isCommand ? 'font-mono text-sm whitespace-pre' : ''}`}>
        {msg.message}
      </div>
    </div>
  );

  const renderFileList = () => (
    <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      {Object.keys(generatedFiles).length > 0 ? (
        <ul className="space-y-2">
          {Object.entries(generatedFiles).map(([filename, content]) => (
            <li
              key={filename}
              className={`${
                selectedFile?.name === filename 
                  ? 'bg-blue-600' 
                  : 'bg-gray-800 hover:bg-gray-700'
              } p-3 rounded-lg cursor-pointer transition-colors duration-200`}
              onClick={() => setSelectedFile({ name: filename, content, isGenerated: true })}
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
              ? 'bg-blue-600' 
              : 'bg-gray-800 hover:bg-gray-700'
          } px-4 py-2.5 rounded-lg cursor-pointer transition-colors duration-200 flex-shrink-0 flex items-center min-w-[120px] max-w-[120px]`}
          onClick={() => {
            setSelectedFile({ name: filename, content, isGenerated: true });
            setShowCodeDrawer(true);
          }}
        >
          <span className="text-sm text-gray-200 truncate">
            {filename}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-900 text-white overflow-hidden">
      <div className="w-full lg:w-[35%] border-r border-gray-700 flex flex-col h-full">
        <div className="p-4 border-b border-gray-700 flex items-center shrink-0">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-700 rounded-full mr-3">
            <FaArrowLeft size={16} />
          </button>
          <h2 className="text-xl font-semibold flex-1">Project Chat</h2>
          <button onClick={() => setShowSidePanel(!showSidePanel)} className="p-2 hover:bg-gray-700 rounded-full">
            <FaUsers size={20} />
          </button>
        </div>

        <div className="relative flex-1">
          <div 
            ref={messageBox} 
            className="absolute inset-0 overflow-y-auto p-4 space-y-4 scroll-smooth overflow-x-hidden"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #1F2937',
              height: 'calc(100vh - 180px)', // Account for header, input, and generated files
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 8px;
              }
              div::-webkit-scrollbar-track {
                background: #1F2937;
              }
              div::-webkit-scrollbar-thumb {
                background-color: #4B5563;
                border-radius: 20px;
                border: 2px solid #1F2937;
              }
            `}</style>
            {messages.map((msg, index) => renderMessage(msg, index))}
          </div>

          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 left-4 bg-blue-600 p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 z-30"
              aria-label="Scroll to bottom"
            >
              <FaArrowDown className="text-white" size={20} />
            </button>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900 shrink-0 z-20">
          <div className="flex space-x-2">
            <input 
              value={messageText} 
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" 
            />
            <button onClick={send} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"><IoSend /></button>
          </div>
        </div>

        <div className="lg:hidden border-t border-gray-700 bg-gray-900 shrink-0 pb-safe">
          <div className="p-3">
            <h2 className="text-lg font-semibold mb-2">Generated Files</h2>
            {Object.keys(generatedFiles).length > 0 ? (
              renderMobileFileList()
            ) : (
              <div className="text-center text-gray-500 py-2">
                No generated files yet. Use @ai to generate code.
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
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
        <div className="p-4 border-b border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold">
            {selectedFile ? selectedFile.name : 'Select a file to preview'}
          </h2>
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
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setShowCodeDrawer(false)} />
      )}
      
      <div className={`lg:hidden fixed inset-x-0 bottom-0 w-full bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-40 rounded-t-2xl ${showCodeDrawer ? 'translate-y-0' : 'translate-y-full'}`} style={{ maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col h-full">
          <div className="w-full flex justify-center p-2">
            <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
          </div>

          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedFile ? selectedFile.name : 'Select a file to preview'}
            </h2>
            <button
              onClick={() => setShowCodeDrawer(false)}
              className="p-2 hover:bg-gray-700 rounded-full"
            >
              <FaTimes size={20} />
            </button>
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

      <div className={`fixed inset-y-0 left-0 w-full sm:w-[350px] lg:w-[35%] bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${showSidePanel ? 'translate-x-0' : '-translate-x-full'}`}>
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
              <span className="text-sm text-white font-semibold">Add Collaborator +</span>
            </li>
            {loading ? (
              <div className="text-center text-gray-400">Loading collaborators...</div>
            ) : collaborators.length > 0 ? (
              collaborators.map((collaborator, index) => (
                <li
                  key={collaborator._id}
                  className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                >
                  <span className="text-sm text-gray-200">{collaborator.email}</span>
                </li>
              ))
            ) : (
              <div className="text-center text-gray-400">No collaborators found</div>
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
                  setError('');
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
    </div>
  );
};

export default Project;