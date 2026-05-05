import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle, Paperclip, File as FileIcon, Image as ImageIcon, Download, AtSign, Palette, Reply, MessageSquare } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import ThreadPanel from './ThreadPanel';

interface Message {
  id: string;
  taskId: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mentions?: string[];
  messageColor?: string; // Deprecated - now using sender.messageColor
  parentMessageId?: string;
  replyCount?: number;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    messageColor?: string; // User's global message color preference
  };
}

interface TeamMember {
  id: string;
  user_id: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    messageColor?: string;
  };
}

interface TaskChatProps {
  taskId: string;
  taskTitle: string;
  currentUserId: string;
  onClose: () => void;
  businessId?: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://pi-dev-backend.onrender.com';

// Compress image before upload
async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        const maxDimension = 1920;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              } as FilePropertyBag);
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8,
        );
      };
      img.onerror = () => {
        resolve(file); // If image fails to load, return original file
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve(file); // If reader fails, return original file
    };
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default function TaskChat({ taskId, taskTitle, currentUserId, onClose, businessId }: TaskChatProps): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [messageColor, setMessageColor] = useState<string>('#4F46E5'); // Default indigo
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [openThread, setOpenThread] = useState<Message | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat color preference for this task
  useEffect(() => {
    async function loadChatColor() {
      try {
        const res = await fetch(`${API_BASE}/messages/chat-color/${taskId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.color) {
            setMessageColor(data.color);
          }
        }
      } catch (error) {
        console.error('Failed to load chat color:', error);
      }
    }
    loadChatColor();
  }, [taskId]);

  // Close color picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    }
    
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Fetch messages and team members
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`${API_BASE}/messages/task/${taskId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();

    // Fetch team members if businessId is provided
    if (businessId) {
      async function fetchTeamMembers() {
        try {
          const res = await fetch(`${API_BASE}/businesses/${businessId}/members`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            setTeamMembers(Array.isArray(data) ? data : data.members || []);
          }
        } catch (error) {
          console.error('Failed to fetch team members:', error);
        }
      }
      fetchTeamMembers();
    }
  }, [taskId, businessId]);

  // Helper to get current user name from team members
  const getCurrentUserName = () => {
    // Try to get from team members first
    const currentMember = teamMembers.find(m => m.user_id === currentUserId);
    if (currentMember) {
      return getMemberName(currentMember);
    }
    
    // Try to get from messages
    const myMessage = messages.find(m => m.senderId === currentUserId);
    if (myMessage) {
      return getSenderName(myMessage.sender);
    }
    
    return 'Someone';
  };

  // Refs to store taskId and currentUserId without causing re-renders
  const taskIdRef = useRef(taskId);
  const currentUserIdRef = useRef(currentUserId);

  // Update refs when props change
  useEffect(() => {
    taskIdRef.current = taskId;
  }, [taskId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Socket.io connection - runs ONCE on mount
  useEffect(() => {
    // Prevent double socket creation (React StrictMode mounts twice in dev)
    if (socketRef.current && socketRef.current.connected) {
      console.log('⚠️ Socket already exists and is connected, reusing it');
      setSocket(socketRef.current);
      return;
    }

    // If socket exists but is disconnected, clean it up first
    if (socketRef.current) {
      console.log('⚠️ Socket exists but is disconnected, cleaning up');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log('🔌 Initializing socket connection to:', API_BASE);
    console.log('🔑 Current user ID:', currentUserIdRef.current);
    console.log('📋 Task ID:', taskIdRef.current);
    
    // Extract token from cookies for socket authentication
    const getCookieValue = (name: string): string | undefined => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : undefined;
    };
    
    const token = getCookieValue('access_token') || getCookieValue('token') || '';
    
    let reconnectAttempts = 0;
    const MAX_RECONNECT = 3;
    
    const newSocket = io(`${API_BASE}/messages`, {
      withCredentials: true,
      transports: ['polling', 'websocket'], // Polling first for better compatibility
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      auth: {
        token: token, // Send token for authentication
      },
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('✅ Connected to socket, Socket ID:', newSocket.id);
      reconnectAttempts = 0; // Reset on successful connection
      // Emit joinTask AFTER connection is confirmed
      const taskIdValue = taskIdRef.current;
      console.log('📤 Joining task room:', taskIdValue, 'Type:', typeof taskIdValue, 'Socket ID:', newSocket.id);
      newSocket.emit('joinTask', taskIdValue);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket:', reason);
      if (reason === 'io server disconnect') {
        reconnectAttempts++;
        if (reconnectAttempts <= MAX_RECONNECT) {
          console.log(`Server disconnected, attempt ${reconnectAttempts}/${MAX_RECONNECT}`);
          setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.connect();
            }
          }, 2000 * reconnectAttempts);
        } else {
          console.error('Max reconnect attempts reached, giving up');
        }
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    newSocket.on('joinedTask', (data) => {
      console.log('✅ Successfully joined task room:', data);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Remove old listeners before adding new ones
    newSocket.off('newMessage');
    newSocket.on('newMessage', (message: Message) => {
      console.log('📨 Received new message via socket:', message.id);
      setMessages((prev) => {
        if (prev.find(m => m.id === message.id)) {
          console.log('⚠️ Message already exists, skipping:', message.id);
          return prev;
        }
        console.log('✅ Adding new message to state');
        return [...prev, message];
      });
    });

    newSocket.off('newReply');
    newSocket.on('newReply', (data: { reply: Message; parentMessageId: string; newReplyCount: number }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.parentMessageId
            ? { ...msg, replyCount: data.newReplyCount }
            : msg
        )
      );
    });

    newSocket.off('userTyping');
    newSocket.on('userTyping', (data: { userId: string; userName: string; isTyping: boolean }) => {
      console.log('📝 Received userTyping event:', data);
      if (data.userId === currentUserIdRef.current) {
        console.log('⚠️ Ignoring own typing event');
        return;
      }
      
      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (!prev.find(u => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, userName: data.userName }];
          }
          return prev;
        } else {
          return prev.filter(u => u.userId !== data.userId);
        }
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up socket on unmount');
      newSocket.emit('leaveTask', taskIdRef.current);
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('joinedTask');
      newSocket.off('error');
      newSocket.off('newMessage');
      newSocket.off('newReply');
      newSocket.off('userTyping');
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty dependencies - runs ONCE on mount, cleanup ONLY on unmount

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    setSending(true);
    setUploadProgress(0);

    // Arrêter l'indicateur de typing
    if (socket && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('userTyping', {
        taskId: taskIdRef.current,
        userId: currentUserIdRef.current,
        userName: getCurrentUserName(),
        isTyping: false,
      });
    }

    try {
      const formData = new FormData();
      formData.append('taskId', taskIdRef.current);
      
      if (newMessage.trim()) {
        formData.append('content', newMessage.trim());
      }

      if (selectedFile) {
        // Compress image if it's an image file
        const fileToUpload = selectedFile.type.startsWith('image/')
          ? await compressImage(selectedFile)
          : selectedFile;
        
        formData.append('file', fileToUpload);
      }

      // Add mentions if any
      if (selectedMentions.length > 0) {
        formData.append('mentions', JSON.stringify(selectedMentions));
      }

      // Add parent message ID if replying
      if (replyingTo) {
        formData.append('parentMessageId', replyingTo.id);
      }

      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        const sentMessage = await res.json();
        
        // Do NOT add message optimistically - let the socket event handle it
        // This ensures both sender and receiver see the message at the same time
        
        // Clear form
        setNewMessage('');
        setSelectedFile(null);
        setUploadProgress(0);
        setSelectedMentions([]);
        setShowMentions(false);
        setReplyingTo(null);
        
        console.log('✅ Message sent successfully:', sentMessage);
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to send message:', errorText);
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setNewMessage(value);

    // Émettre l'événement typing avec debounce
    emitTypingEvent(true);

    // Check for @ symbol to trigger mentions
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionPosition(lastAtIndex);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const emitTypingEvent = (isTyping: boolean) => {
    if (!socket) {
      console.log('⚠️ Socket not connected, cannot emit typing event');
      return;
    }

    if (!socket.connected) {
      console.log('⚠️ Socket not connected (disconnected state)');
      return;
    }

    // Annuler le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Récupérer le nom de l'utilisateur actuel
    const userName = getCurrentUserName();
    
    const typingData = {
      taskId: taskIdRef.current,
      userId: currentUserIdRef.current,
      userName: userName,
      isTyping: isTyping,
    };
    
    console.log('📤 Emitting userTyping event:', typingData);
    
    // Émettre l'événement typing
    socket.emit('userTyping', typingData);

    // Arrêter le typing après 2 secondes d'inactivité
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⏱️ Typing timeout - stopping typing indicator');
      socket.emit('userTyping', {
        taskId: taskIdRef.current,
        userId: currentUserIdRef.current,
        userName: userName,
        isTyping: false,
      });
    }, 2000);
  };

  const insertMention = (member: TeamMember) => {
    const memberName = getMemberName(member);
    const beforeMention = newMessage.substring(0, mentionPosition);
    const afterMention = newMessage.substring(textareaRef.current?.selectionStart || newMessage.length);
    const newText = `${beforeMention}@${memberName} ${afterMention}`;
    
    setNewMessage(newText);
    setShowMentions(false);
    setMentionSearch('');
    
    // Add to selected mentions
    if (!selectedMentions.includes(member.user_id)) {
      setSelectedMentions([...selectedMentions, member.user_id]);
    }
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  const getMemberName = (member: TeamMember) => {
    if (member.user.firstName || member.user.lastName) {
      return `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim();
    }
    return member.user.email.split('@')[0];
  };

  const filteredMembers = teamMembers.filter((member) => {
    if (!mentionSearch) return true;
    const name = getMemberName(member).toLowerCase();
    const email = member.user.email.toLowerCase();
    return name.includes(mentionSearch) || email.includes(mentionSearch);
  });

  const getSenderName = (sender: Message['sender']) => {
    if (sender.firstName || sender.lastName) {
      return `${sender.firstName || ''} ${sender.lastName || ''}`.trim();
    }
    return sender.email;
  };

  const getFileUrl = (fileUrl: string | undefined) => {
    if (!fileUrl) return '';
    return fileUrl.startsWith('http')
      ? fileUrl
      : `${API_BASE}${fileUrl}`;
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const fullUrl = fileUrl.startsWith('http')
      ? fileUrl
      : `${API_BASE}${fileUrl}`;
    
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ File download initiated:', fileName);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessageWithMentions = (content: string) => {
    // Highlight @mentions in the message
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span
            key={index}
            className="font-semibold"
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted'
            }}
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const handleColorChange = (color: string) => {
    setMessageColor(color);
    setShowColorPicker(false);
    // Save to backend for this specific task
    updateChatColor(color);
  };

  const updateChatColor = async (color: string) => {
    try {
      const res = await fetch(`${API_BASE}/messages/chat-color/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ color }),
      });
      
      if (!res.ok) {
        console.error('Failed to update chat color');
      }
    } catch (error) {
      console.error('Error updating chat color:', error);
    }
  };

  const predefinedColors = [
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#9333EA' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Green', value: '#10B981' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Sky', value: '#0EA5E9' },
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Fuchsia', value: '#D946EF' },
    { name: 'Rose', value: '#F43F5E' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Slate', value: '#64748B' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Task Chat</h2>
              <p className="text-sm text-gray-500 truncate max-w-md">{taskTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              const isImage = message.fileType?.startsWith('image/');
              const isHovered = hoveredMessageId === message.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'} relative`}>
                    {!isOwn && (
                      <p className="text-xs font-medium text-gray-600 mb-1 px-3">
                        {getSenderName(message.sender)}
                      </p>
                    )}
                    
                    {/* Reply button on hover */}
                    {isHovered && (
                      <button
                        onClick={() => setReplyingTo(message)}
                        className="absolute -top-2 right-2 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors z-10"
                        title="Répondre"
                      >
                        <Reply className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                    
                    <div
                      className="rounded-2xl px-4 py-2"
                      style={{
                        backgroundColor: messageColor || '#4F46E5',
                        color: '#FFFFFF'
                      }}
                    >
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {renderMessageWithMentions(message.content)}
                        </p>
                      )}
                      {message.mentions && message.mentions.length > 0 && (
                        <div 
                          className="flex items-center gap-1 mt-2 text-xs"
                          style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          <AtSign className="h-3 w-3" />
                          <span>{message.mentions.length} mentioned</span>
                        </div>
                      )}
                      
                      {message.fileUrl && (
                        <div className="mt-2">
                          {isImage ? (
                            <a
                              href={getFileUrl(message.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={getFileUrl(message.fileUrl)}
                                alt={message.fileName}
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ maxHeight: '300px' }}
                              />
                            </a>
                          ) : (
                            <button
                              onClick={() => handleFileDownload(message.fileUrl!, message.fileName!)}
                              className="flex items-center gap-2 p-2 rounded-lg transition-colors w-full text-left"
                              style={{
                                backgroundColor: `${messageColor || '#4F46E5'}dd`,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${messageColor || '#4F46E5'}ee`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = `${messageColor || '#4F46E5'}dd`;
                              }}
                            >
                              <FileIcon className="h-5 w-5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {message.fileName}
                                </p>
                                {message.fileSize && (
                                  <p className="text-xs opacity-75">
                                    {formatFileSize(message.fileSize)}
                                  </p>
                                )}
                              </div>
                              <Download className="h-4 w-4 flex-shrink-0" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Thread button */}
                    {message.replyCount !== undefined && message.replyCount > 0 && (
                      <button
                        onClick={() => setOpenThread(message)}
                        className="flex items-center gap-2 mt-2 px-3 py-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium">
                          {message.replyCount} réponse{message.replyCount > 1 ? 's' : ''} · Voir le fil
                        </span>
                      </button>
                    )}
                    
                    <p
                      className={`text-xs text-gray-400 mt-1 px-3 ${
                        isOwn ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0].userName} est en train d'écrire...`
                  : typingUsers.length === 2
                  ? `${typingUsers[0].userName} et ${typingUsers[1].userName} sont en train d'écrire...`
                  : `${typingUsers.length} personnes sont en train d'écrire...`}
              </span>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 relative">
          {/* Reply preview bar */}
          {replyingTo && (
            <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-3">
              <Reply className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-indigo-900 mb-1">
                  Répondre à {getSenderName(replyingTo.sender)}
                </p>
                <p className="text-sm text-indigo-700 truncate">
                  {replyingTo.content || (replyingTo.fileName ? `📎 ${replyingTo.fileName}` : 'Message')}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-indigo-400 hover:text-indigo-600 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {/* Color Picker */}
          {showColorPicker && (
            <div 
              ref={colorPickerRef}
              className="absolute bottom-full left-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-20"
              style={{ width: '280px' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Choose chat color</h3>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                This color will apply to all messages in this chat (only for you)
              </p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {predefinedColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className="group relative"
                    title={color.name}
                  >
                    <div
                      className="h-10 w-10 rounded-lg transition-transform hover:scale-110 border-2"
                      style={{
                        backgroundColor: color.value,
                        borderColor: messageColor === color.value ? '#1F2937' : 'transparent'
                      }}
                    />
                    {messageColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Custom color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={messageColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="h-10 w-full rounded cursor-pointer"
                  />
                  <div
                    className="h-10 w-20 rounded border border-gray-300 flex items-center justify-center text-xs font-mono text-gray-600"
                  >
                    {messageColor.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <div className="flex items-center justify-between mb-1">
                  <span>Preview:</span>
                  <span className="text-gray-500">All messages in this chat</span>
                </div>
                <div className="flex gap-2">
                  <div 
                    className="flex-1 px-3 py-2 rounded-lg text-white text-xs"
                    style={{ backgroundColor: messageColor }}
                  >
                    Your message
                  </div>
                  <div 
                    className="flex-1 px-3 py-2 rounded-lg text-white text-xs"
                    style={{ backgroundColor: messageColor }}
                  >
                    Other's message
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedFile && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="h-8 w-8 text-indigo-600" />
              ) : (
                <FileIcon className="h-8 w-8 text-indigo-600" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={removeSelectedFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Mentions dropdown */}
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              <div className="p-2">
                <p className="text-xs font-medium text-gray-500 px-2 py-1">Mention team member</p>
                {filteredMembers.slice(0, 5).map((member) => (
                  <button
                    key={member.id}
                    onClick={() => insertMention(member)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {getMemberName(member).substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getMemberName(member)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {member.user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                const cursorPos = textareaRef.current?.selectionStart || newMessage.length;
                const newText = newMessage.substring(0, cursorPos) + '@' + newMessage.substring(cursorPos);
                setNewMessage(newText);
                setMentionPosition(cursorPos);
                setShowMentions(true);
                textareaRef.current?.focus();
              }}
              disabled={sending}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mention someone"
            >
              <AtSign className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={sending}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              title="Change message color"
            >
              <Palette className="h-5 w-5" />
              <div
                className="absolute bottom-1 right-1 h-2 w-2 rounded-full border border-white"
                style={{ backgroundColor: messageColor }}
              />
            </button>
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... (use @ to mention)"
              rows={1}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || sending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {uploadProgress > 0 && (
                    <span className="text-xs">{uploadProgress}%</span>
                  )}
                </>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Thread Panel */}
      {openThread && (
        <ThreadPanel
          parentMessage={openThread}
          taskId={taskId}
          currentUserId={currentUserId}
          socket={socket}
          onClose={() => setOpenThread(null)}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}

