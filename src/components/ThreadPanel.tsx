import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Paperclip, File as FileIcon, Image as ImageIcon, Download, AtSign, MessageSquare } from 'lucide-react';
import { Socket } from 'socket.io-client';

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
  messageColor?: string;
  parentMessageId?: string;
  replyCount?: number;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    messageColor?: string;
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

interface ThreadPanelProps {
  parentMessage: Message;
  taskId: string;
  currentUserId: string;
  socket: Socket | null;
  onClose: () => void;
  teamMembers: TeamMember[];
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://pi-dev-backend.onrender.com';

async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

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
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
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

export default function ThreadPanel({ parentMessage, taskId, currentUserId, socket, onClose, teamMembers }: ThreadPanelProps) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const repliesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [replies]);

  // Fetch thread replies
  useEffect(() => {
    async function fetchThread() {
      try {
        const res = await fetch(`${API_BASE}/messages/thread/${parentMessage.id}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setReplies(data.replies || []);
        }
      } catch (error) {
        console.error('Failed to fetch thread:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchThread();
  }, [parentMessage.id]);

  // Listen for new replies via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewReply = (data: { reply: Message; parentMessageId: string; newReplyCount: number }) => {
      if (data.parentMessageId === parentMessage.id) {
        setReplies((prev) => [...prev, data.reply]);
      }
    };

    socket.on('newReply', handleNewReply);

    return () => {
      socket.off('newReply', handleNewReply);
    };
  }, [socket, parentMessage.id]);

  const handleSendReply = async () => {
    if ((!newReply.trim() && !selectedFile) || sending) return;

    setSending(true);

    try {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('parentMessageId', parentMessage.id);
      
      if (newReply.trim()) {
        formData.append('content', newReply.trim());
      }

      if (selectedFile) {
        const fileToUpload = selectedFile.type.startsWith('image/')
          ? await compressImage(selectedFile)
          : selectedFile;
        
        formData.append('file', fileToUpload);
      }

      if (selectedMentions.length > 0) {
        formData.append('mentions', JSON.stringify(selectedMentions));
      }

      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        setNewReply('');
        setSelectedFile(null);
        setSelectedMentions([]);
        setShowMentions(false);
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      handleSendReply();
    }
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setNewReply(value);

    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
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

  const insertMention = (member: TeamMember) => {
    const memberName = getMemberName(member);
    const beforeMention = newReply.substring(0, mentionPosition);
    const afterMention = newReply.substring(textareaRef.current?.selectionStart || newReply.length);
    const newText = `${beforeMention}@${memberName} ${afterMention}`;
    
    setNewReply(newText);
    setShowMentions(false);
    setMentionSearch('');
    
    if (!selectedMentions.includes(member.user_id)) {
      setSelectedMentions([...selectedMentions, member.user_id]);
    }
    
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessageWithMentions = (content: string) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
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

  const isImage = parentMessage.fileType?.startsWith('image/');

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Fil de discussion</h3>
            <p className="text-sm text-gray-500">{replies.length} réponse{replies.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Original Message */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <p className="text-xs font-medium text-gray-600 mb-2">
          {getSenderName(parentMessage.sender)}
        </p>
        <div
          className="rounded-2xl px-4 py-2"
          style={{
            backgroundColor: parentMessage.sender.messageColor || '#4F46E5',
            color: '#FFFFFF'
          }}
        >
          {parentMessage.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {renderMessageWithMentions(parentMessage.content)}
            </p>
          )}
          
          {parentMessage.fileUrl && (
            <div className="mt-2">
              {isImage ? (
                <img
                  src={`${API_BASE}${parentMessage.fileUrl}`}
                  alt={parentMessage.fileName}
                  className="max-w-full rounded-lg"
                  style={{ maxHeight: '200px' }}
                />
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/10">
                  <FileIcon className="h-5 w-5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{parentMessage.fileName}</p>
                    {parentMessage.fileSize && (
                      <p className="text-xs opacity-75">{formatFileSize(parentMessage.fileSize)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1 px-3">
          {formatTime(parentMessage.createdAt)}
        </p>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="h-12 w-12 mb-3" />
            <p className="text-sm">Aucune réponse pour le moment</p>
            <p className="text-xs">Soyez le premier à répondre!</p>
          </div>
        ) : (
          replies.map((reply) => {
            const isOwn = reply.senderId === currentUserId;
            const isReplyImage = reply.fileType?.startsWith('image/');
            
            return (
              <div
                key={reply.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && (
                    <p className="text-xs font-medium text-gray-600 mb-1 px-3">
                      {getSenderName(reply.sender)}
                    </p>
                  )}
                  <div
                    className="rounded-2xl px-4 py-2"
                    style={{
                      backgroundColor: reply.sender.messageColor || '#4F46E5',
                      color: '#FFFFFF'
                    }}
                  >
                    {reply.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {renderMessageWithMentions(reply.content)}
                      </p>
                    )}
                    
                    {reply.fileUrl && (
                      <div className="mt-2">
                        {isReplyImage ? (
                          <a
                            href={`${API_BASE}${reply.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={`${API_BASE}${reply.fileUrl}`}
                              alt={reply.fileName}
                              className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                              style={{ maxHeight: '200px' }}
                            />
                          </a>
                        ) : (
                          <a
                            href={`${API_BASE}${reply.fileUrl}`}
                            download={reply.fileName}
                            className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20"
                          >
                            <FileIcon className="h-5 w-5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{reply.fileName}</p>
                              {reply.fileSize && (
                                <p className="text-xs opacity-75">{formatFileSize(reply.fileSize)}</p>
                              )}
                            </div>
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 px-3 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTime(reply.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={repliesEndRef} />
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {selectedFile && (
          <div className="mb-3 p-3 bg-white rounded-lg flex items-center gap-3 border border-gray-200">
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

        {showMentions && filteredMembers.length > 0 && (
          <div className="mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <div className="p-2">
              <p className="text-xs font-medium text-gray-500 px-2 py-1">Mentionner un membre</p>
              {filteredMembers.slice(0, 5).map((member) => (
                <button
                  key={member.id}
                  onClick={() => insertMention(member)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium">
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
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Joindre un fichier"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              const cursorPos = textareaRef.current?.selectionStart || newReply.length;
              const newText = newReply.substring(0, cursorPos) + '@' + newReply.substring(cursorPos);
              setNewReply(newText);
              setMentionPosition(cursorPos);
              setShowMentions(true);
              textareaRef.current?.focus();
            }}
            disabled={sending}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Mentionner quelqu'un"
          >
            <AtSign className="h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={newReply}
            onChange={handleReplyChange}
            onKeyPress={handleKeyPress}
            placeholder="Répondre..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSendReply}
            disabled={(!newReply.trim() && !selectedFile) || sending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
