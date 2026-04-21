'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import NextImage from 'next/image';
import { FileIcon, Eye, Check, CheckCheck, Clock, Download } from 'lucide-react';

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
  onSaveSticker
}: MessageProps) {
  const onlyEmojis = isOnlyEmojis(msg.text);
  const emojiCount = Array.from(msg.text.replace(/\s/g, '')).length;
  const isJumbo = onlyEmojis && emojiCount <= 5 && !msg.audioUrl && !msg.fileUrl && !msg.stickerUrl && !msg.gifUrl;
  const isSticker = !!msg.stickerUrl;
  const isGif = !!msg.gifUrl;

  return (
    <div
      onContextMenu={(e) => onContextMenu(e, msg.id)}
      onTouchStart={(e) => onTouchStart(e, msg.id)}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      className={`message max-w-[75%] px-3 py-1.5 mb-1.5 rounded-[18px] relative break-words flex flex-col cursor-pointer select-none transition-all hover:scale-[1.02] active:scale-[0.98] ${
        isSticker || isGif
          ? `bg-transparent ${isOwn ? 'self-end' : 'self-start'}`
          : isJumbo
            ? `bg-transparent ${isOwn ? 'self-end' : 'self-start'}`
            : isOwn
              ? 'bg-tg-sent-bubble self-end rounded-br-[5px] message-tail-sent shadow-md hover:shadow-lg text-[15px] leading-snug'
              : 'bg-tg-received-bubble self-start rounded-bl-[5px] message-tail-received shadow-md hover:shadow-lg text-[15px] leading-snug'
      }`}
    >
      {msg.forwardedFrom && (
        <div className="text-[13px] font-medium mb-1 italic" style={{ color: themeColor }}>
          Переслано от {msg.forwardedFrom.senderName}
        </div>
      )}
      {msg.replyTo && (
        <div className="mb-1 pl-2 border-l-2 rounded text-[13px] opacity-70" style={{ borderColor: themeColor }}>
          <div className="font-medium" style={{ color: themeColor }}>{msg.replyTo.senderName}</div>
          <div className="truncate max-w-[200px]">{msg.replyTo.text}</div>
        </div>
      )}
      {msg.audioUrl ? (
        <div className="mb-1"><audio controls src={msg.audioUrl} className="h-8 w-48" /></div>
      ) : msg.fileUrl ? (
        <div className="flex items-center gap-2 mb-1 bg-black/5 p-2 rounded-lg">
          <div className="p-2 bg-blue-500 text-white rounded-full"><FileIcon size={16} /></div>
          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate max-w-[150px]">{msg.fileName}</a>
        </div>
      ) : isSticker ? (
        <div className="relative group">
          <img
            src={msg.stickerUrl}
            alt="Sticker"
            className="w-32 h-32 object-contain cursor-pointer"
            onClick={() => onSaveSticker(msg.stickerUrl!)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Download size={20} className="text-white drop-shadow-lg" />
          </div>
        </div>
      ) : isGif ? (
        <img src={msg.gifUrl} alt="GIF" className="w-48 h-auto rounded-lg object-contain" />
      ) : isJumbo ? (
        <span className="text-[64px] leading-none">{msg.text}</span>
      ) : (
        <span className="mb-0.5 text-tg-text-primary">{msg.text}</span>
      )}
      <div className={`text-[11px] select-none relative z-10 pl-2 self-end mt-auto -mb-0.5 flex items-center gap-1 ${
        isSticker || isGif || isJumbo ? 'bg-black/20 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm mt-1' :
        isOwn ? 'text-[#70a050]' : 'text-tg-secondary-text'
      }`}>
        {msg.editedAt && <span className="italic mr-0.5">ред.</span>}
        <span>{msg.time}</span>
        {isChannel && msg.views !== undefined && (
          <>
            <Eye size={12} />
            <span>{msg.views}</span>
          </>
        )}
        {isOwn && !isChannel && (
          msg.status === 'sending' ? <Clock size={12} /> :
          msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />
        )}
      </div>
    </div>
  );
});

export default Message;
