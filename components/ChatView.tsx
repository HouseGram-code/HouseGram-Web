'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  MoreVertical, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Smile, 
  Check, 
  CheckCheck,
  Mic
} from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import { useRouter } from 'next/navigation';

interface ChatViewProps {
  chatId: string;
  isDarkMode: boolean;
}

export default function ChatView({ chatId, isDarkMode }: ChatViewProps) {
  const router = useRouter();
  const { getChatById, sendMessage, markAsRead, currentUser } = useChatContext();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chat = getChatById(chatId);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (chat) {
      markAsRead(chatId);
    }
  }, [chat?.messages, chatId, markAsRead]);

  const handleSend = () => {
    if (messageText.trim() && chat) {
      sendMessage(chat.id, messageText.trim());
      setMessageText('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chat) {
    return (
      <div className={`flex items-center justify-center h-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <div className="mb-4 opacity-50">
            <MessageCircleIcon size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Чат не найден</h3>
          <p className="opacity-70">Выберите другой чат из списка</p>
        </div>
      </div>
    );
  }

  const isCurrentUser = (senderId: string) => senderId === currentUser?.id;

  return (
    <div className={`flex flex-col h-full overflow-hidden ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f0f2f5]'}`}>
      
      {/* Header */}
      <header className={`flex items-center justify-between px-4 py-3 shadow-sm z-10 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#1e293b] border-b border-gray-800' : 'bg-white border-b border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative">
            <img 
              src={chat.contact.avatar || `https://ui-avatars.com/api/?name=${chat.contact.name}&background=random`} 
              alt={chat.contact.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-transparent"
            />
            {chat.contact.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1e293b] rounded-full"></span>
            )}
          </div>
          
          <div className="flex flex-col">
            <h2 className={`font-semibold text-base leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {chat.contact.name}
            </h2>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {chat.contact.isOnline ? 'в сети' : `был(а) ${formatTime(Date.now())}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button className={`p-2.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Phone size={20} />
          </button>
          <button className={`p-2.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Video size={20} />
          </button>
          <button className={`p-2.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {chat.messages.map((msg, index) => {
            const isMe = isCurrentUser(msg.senderId);
            const showAvatar = !isMe && (index === 0 || chat.messages[index - 1].senderId !== msg.senderId);
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : ''}`}
              >
                {!isMe && (
                  <div className="w-8 mr-2 flex-shrink-0">
                    {showAvatar ? (
                      <img 
                        src={chat.contact.avatar || `https://ui-avatars.com/api/?name=${chat.contact.name}&background=random`} 
                        alt="" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : <div className="w-8" />}
                  </div>
                )}
                
                <div 
                  className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 shadow-sm break-words group ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                      : isDarkMode 
                        ? 'bg-[#1e293b] text-gray-100 rounded-2xl rounded-tl-sm border border-gray-700' 
                        : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm border border-gray-100'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  
                  <div className={`flex items-center justify-end gap-1 mt-1 select-none ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    <span className="text-[11px] font-medium">{formatTime(msg.timestamp)}</span>
                    {isMe && (
                      <span>
                        {msg.status === 'read' ? (
                          <CheckCheck size={14} className="text-blue-200" />
                        ) : (
                          <Check size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <footer className={`p-3 sm:p-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1e293b] border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <button className={`p-3 rounded-full transition-colors flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Smile size={24} />
          </button>
          
          <button className={`p-3 rounded-full transition-colors flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Paperclip size={24} />
          </button>

          <div className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-200 ${
            isDarkMode 
              ? 'bg-[#0f172a] border-gray-700 focus-within:border-blue-500 focus-within:bg-[#1e293b]' 
              : 'bg-gray-50 border-gray-200 focus-within:border-blue-500 focus-within:bg-white'
          }`}>
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Сообщение..."
              className={`flex-1 bg-transparent border-none outline-none text-[15px] py-1 ${
                isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          {messageText.trim() ? (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors flex-shrink-0"
            >
              <Send size={22} className="ml-0.5" />
            </motion.button>
          ) : (
            <button className={`p-3 rounded-full transition-colors flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Mic size={24} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function MessageCircleIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
