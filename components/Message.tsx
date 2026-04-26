'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import NextImage from 'next/image';
import { FileIcon, Eye, Check, CheckCheck, Clock, Download, Play } from 'lucide-react';

interface MessageProps {
  msg: any;
  isOwn: boolean;
  themeColor: string;
  isChannel: boolean;
  onContextMenu: (e: React.MouseEvent, msgId: string) => void;
  onTouchStart: (e: React.TouchEvent, msgId: string) => void;
  onTouchEnd: () => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onSaveSticker: (url: string) => void;
  showAvatar?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

const isOnlyEmojis = (str: string) => {
  const noSpace = str.replace(/\s/g, '');
  if (!noSpace) return false;
  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\p{Emoji_Modifier}]+$/u.test(noSpace);
};

const Message = memo(function Message({
  msg,
  isOwn,
  themeColor,
  isChannel,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  onSaveSticker,
  showAvatar = false,
  isFirstInGroup = true,
  isLastInGroup = true
}: MessageProps) {
  const onlyEmojis = isOnlyEmojis(msg.text);
  const emojiCount = Array.from(msg.text.replace(/\s/g, '')).length;
  const isJumbo = onlyEmojis && emojiCount <= 5 && !msg.audioUrl && !msg.fileUrl && !msg.stickerUrl && !msg.gifUrl;
  const isSticker = !!msg.stickerUrl;
  const isGif = !!msg.gifUrl;
  
  // Динамические радиусы для группировки - Telegram Style
  const borderRadius = isSticker || isGif || isJumbo ? 'rounded-[18px]' : 
    isOwn ? 
      `${isFirstInGroup ? 'rounded-t-[18px]' : 'rounded-tr-[18px]'} ${isLastInGroup ? 'rounded-b-[18px] rounded-br-[5px]' : 'rounded-br-[18px]'}` :
      `${isFirstInGroup ? 'rounded-t-[18px]' : 'rounded-tl-[18px]'} ${isLastInGroup ? 'rounded-b-[18px] rounded-bl-[5px]' : 'rounded-bl-[18px]'}`;

  return (
    <motion.div
      onContextMenu={(e) => onContextMenu(e, msg.id)}
      onTouchStart={(e) => onTouchStart(e, msg.id)}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      className={`message w-full px-3 py-1.5 ${borderRadius} relative break-words flex flex-col cursor-pointer select-none ${
        isSticker || isGif
          ? `bg-transparent ${isOwn ? 'self-end' : 'self-start'}`
          : isJumbo
            ? `bg-transparent ${isOwn ? 'self-end' : 'self-start'}`
            : isOwn
              ? `bg-tg-sent-bubble self-end ${isLastInGroup ? 'message-tail-sent' : ''} shadow-md text-[15px] leading-snug`
              : `bg-tg-received-bubble self-start ${isLastInGroup ? 'message-tail-received' : ''} shadow-md text-[15px] leading-snug`
      }`}
      whileHover={!isSticker && !isGif ? { 
        scale: 1.01,
        boxShadow: isOwn 
          ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: { duration: 0.2 }
      } : {}}
      whileTap={{ scale: 0.98 }}
    >
      {/* Forwarded Label */}
      <AnimatePresence>
        {msg.forwardedFrom && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[13px] font-medium mb-1 italic flex items-center gap-1" 
            style={{ color: themeColor }}
          >
            <motion.svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              initial={{ x: -5, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </motion.svg>
            Переслано от {msg.forwardedFrom.senderName}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Preview */}
      <AnimatePresence>
        {msg.replyTo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 pl-2.5 py-1.5 border-l-[3px] rounded-sm bg-black/5 backdrop-blur-sm overflow-hidden" 
            style={{ borderColor: themeColor }}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
          >
            <div className="font-semibold text-[13px] mb-0.5" style={{ color: themeColor }}>
              {msg.replyTo.senderName}
            </div>
            <div className="text-[13px] text-gray-700 line-clamp-2 leading-tight">
              {msg.replyTo.text || 'Медиа'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Message */}
      {msg.audioUrl ? (
        <motion.div 
          className="mb-1"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <audio controls src={msg.audioUrl} className="h-8 w-48" />
        </motion.div>
      ) : msg.fileUrl ? (
        msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
          /* Image */
          <motion.div 
            className="mb-1 rounded-lg overflow-hidden cursor-pointer relative group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <NextImage
              src={msg.fileUrl}
              alt={msg.fileName || 'Image'}
              width={300}
              height={200}
              className="object-cover rounded-lg"
              unoptimized
            />
            {/* Image Overlay on Hover */}
            <motion.div 
              className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
              >
                <Eye size={24} className="text-gray-700" />
              </motion.div>
            </motion.div>
            {msg.fileName && (
              <div className="text-[13px] mt-1 opacity-70">{msg.fileName}</div>
            )}
          </motion.div>
        ) : (
          /* File */
          <motion.div 
            className="flex items-center gap-2 mb-1 bg-black/5 p-2 rounded-lg"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.08)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <motion.div 
              className="p-2 bg-blue-500 text-white rounded-full"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FileIcon size={16} />
            </motion.div>
            <a 
              href={msg.fileUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-600 underline truncate max-w-[150px] hover:text-blue-700"
            >
              {msg.fileName}
            </a>
          </motion.div>
        )
      ) : isSticker ? (
        /* Sticker */
        <motion.div 
          className="relative group"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
        >
          <img
            src={msg.stickerUrl}
            alt="Sticker"
            className="w-32 h-32 object-contain cursor-pointer"
            onClick={() => onSaveSticker(msg.stickerUrl!)}
          />
          <motion.div 
            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileHover={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring" }}
            >
              <Download size={20} className="text-white drop-shadow-lg" />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : isGif ? (
        /* GIF */
        <motion.img 
          src={msg.gifUrl} 
          alt="GIF" 
          className="w-48 h-auto rounded-lg object-contain"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
        />
      ) : isJumbo ? (
        /* Jumbo Emoji */
        <motion.span 
          className="text-[64px] leading-none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          whileHover={{ 
            scale: 1.1,
            rotate: [0, -10, 10, -10, 0],
            transition: { duration: 0.5 }
          }}
        >
          {msg.text}
        </motion.span>
      ) : (
        /* Text Message */
        <motion.span 
          className="mb-0.5 text-tg-text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {msg.text}
        </motion.span>
      )}

      {/* Message Footer (Time + Status) */}
      <motion.div 
        className={`text-[11px] select-none relative z-10 pl-2 self-end mt-auto -mb-0.5 flex items-center gap-1 ${
          isSticker || isGif || isJumbo ? 'bg-black/20 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm mt-1' :
          isOwn ? 'text-[#70a050]' : 'text-tg-secondary-text'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {msg.editedAt && (
          <motion.span 
            className="italic mr-0.5"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
          >
            ред.
          </motion.span>
        )}
        <span>{msg.time}</span>
        
        {/* Channel Views */}
        {isChannel && msg.views !== undefined && (
          <motion.div 
            className="flex items-center gap-0.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Eye size={12} />
            <span>{msg.views}</span>
          </motion.div>
        )}
        
        {/* Message Status (Own messages only) */}
        {isOwn && !isChannel && (
          <AnimatePresence mode="wait">
            {msg.status === 'sending' ? (
              <motion.div
                key="sending"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Clock size={12} />
                </motion.div>
              </motion.div>
            ) : msg.status === 'read' ? (
              <motion.div
                key="read"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 0.3,
                    times: [0, 0.5, 1]
                  }}
                >
                  <CheckCheck size={14} className="text-blue-500" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="sent"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <Check size={14} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
});

export default Message;
