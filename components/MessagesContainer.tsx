'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { Bookmark } from 'lucide-react';
import Message from './Message';

interface MessagesContainerProps {
  contact: any;
  themeColor: string;
  wallpaper: string | null;
  isGlassEnabled: boolean;
  onContextMenu: (e: React.MouseEvent, msgId: string) => void;
  onTouchStart: (e: React.TouchEvent, msgId: string) => void;
  onTouchEnd: () => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onSaveSticker: (url: string) => void;
  onShowPicker: (show: boolean) => void;
  onShowAttachMenu: (show: boolean) => void;
  onSetContextMenu: (menu: null) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
}

const MessagesContainer = memo(function MessagesContainer({
  contact,
  themeColor,
  wallpaper,
  isGlassEnabled,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  onSaveSticker,
  onShowPicker,
  onShowAttachMenu,
  onSetContextMenu,
  messagesContainerRef,
  messagesEndRef,
  onScroll
}: MessagesContainerProps) {
  return (
    <div
      ref={messagesContainerRef}
      onScroll={onScroll}
      className="flex-grow overflow-y-auto p-2.5 pt-14 flex flex-col no-scrollbar relative z-10"
      style={{
        backgroundImage: wallpaper && !wallpaper.startsWith('linear') ? `url('${wallpaper}')` : 'none',
        background: wallpaper || 'var(--tg-bg-dark)',
        backgroundSize: wallpaper && !wallpaper.startsWith('linear') ? 'cover' : undefined,
        backgroundPosition: wallpaper && !wallpaper.startsWith('linear') ? 'center' : undefined,
      }}
      onClick={() => { onShowPicker(false); onShowAttachMenu(false); onSetContextMenu(null); }}
    >
      {contact.id === 'saved_messages' && contact.messages.length === 0 && (
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 max-w-sm text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-500 mx-auto flex items-center justify-center mb-4"><Bookmark size={32} fill="currentColor" /></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Избранное</h3>
            <p className="text-[15px] text-gray-600 leading-relaxed">Здесь можно сохранять сообщения, медиа и другие файлы.</p>
          </div>
        </div>
      )}
      {contact.isChannel && contact.messages.length === 0 && (
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 max-w-sm text-center shadow-sm">
            <p className="text-[15px] text-gray-600 leading-relaxed">Постов пока нет.</p>
          </div>
        </div>
      )}

      {contact.messages.map((msg: any) => {
        const isOwn = msg.type === 'sent';

        // Если это подарок, рендерим его отдельно
        if (msg.gift) {
          return (
            <motion.div
              key={msg.id}
              initial={false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`rounded-2xl p-4 text-white text-center min-w-[200px] relative overflow-hidden mb-1.5 ${
                isOwn ? 'self-end' : 'self-start'
              } ${
                msg.gift.id === 'cosmonaut'
                  ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black'
                  : msg.gift.id === 'easter_bunny' 
                  ? 'bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}
            >
              <motion.div
                animate={
                  msg.gift.id === 'cosmonaut'
                    ? { y: [0, -20, 0], rotate: [0, 10, -10, 0] }
                    : msg.gift.id === 'easter_bunny'
                    ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, -3, 3, 0], y: [0, -15, 0, -8, 0] }
                    : { scale: [1, 1.15, 1], rotate: [0, -15, 15, -10, 10, -5, 5, 0], y: [0, -10, 0, -5, 0] }
                }
                transition={{ 
                  duration: msg.gift.id === 'cosmonaut' ? 3 : msg.gift.id === 'easter_bunny' ? 2 : 1.5,
                  times: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
                  ease: "easeInOut",
                  repeat: (msg.gift.id === 'easter_bunny' || msg.gift.id === 'cosmonaut') ? Infinity : 0
                }}
                className="text-[80px] mb-2 relative z-10"
              >
                {msg.gift.emoji}
              </motion.div>
              <div className="text-[16px] font-bold mb-1 relative z-10">{msg.gift.name}</div>
              <div className="text-[13px] text-white/90 flex items-center justify-center gap-1 relative z-10">
                Подарок от {isOwn ? 'вас' : contact.name}
              </div>
            </motion.div>
          );
        }

        // Для обычных сообщений используем мемоизированный компонент
        return (
          <Message
            key={msg.id}
            msg={msg}
            isOwn={isOwn}
            themeColor={themeColor}
            isChannel={contact.isChannel || false}
            onContextMenu={onContextMenu}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchMove={onTouchMove}
            onSaveSticker={onSaveSticker}
          />
        );
      })}

      {/* Индикатор печати */}
      <motion.div 
        initial={false}
        animate={{ 
          opacity: contact.isTyping && !contact.isBlocked ? 1 : 0,
          marginBottom: contact.isTyping && !contact.isBlocked ? '6px' : '0px',
          height: contact.isTyping && !contact.isBlocked ? 'auto' : '0px'
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`flex items-center px-3 py-2 bg-tg-received-bubble self-start rounded-[18px] rounded-bl-[5px] message-tail-received relative shadow-md overflow-hidden ${
          contact.isTyping && !contact.isBlocked 
            ? 'min-h-[44px]' 
            : 'pointer-events-none'
        }`}
      >
        <div className="dot-flashing"></div>
      </motion.div>
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessagesContainer;
