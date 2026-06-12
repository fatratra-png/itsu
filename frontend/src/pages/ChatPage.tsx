import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Paperclip, Smile, Reply, Trash2, ChevronDown, X, Download, FileText, Loader, WifiOff } from "lucide-react";

interface Reaction {
  userId: number;
  userName: string;
  emoji: string;
}

interface Message {
  id: number;
  sender: string;
  senderAvatar: string | null;
  senderId: number;
  content: string;
  own: boolean;
  seen: boolean;
  createdAt: string;
  reactions: Reaction[];
  replyToId: number | null;
  replyToContent: string | null;
  replyToSender: string | null;
}

interface ParsedFile {
  filename: string;
  url: string;
  type: "img" | "file";
  size?: number;
  extension?: string;
}

interface ReplyTarget {
  id: number;
  sender: string;
  content: string;
}

interface LightboxImage {
  url: string;
  filename: string;
}

type GroupItem = { type: "separator"; date: Date } | { type: "group"; isOwn: boolean; messages: Message[] };

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const GROUP_GAP = 5 * MINUTE;
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
const TYPING_TIMEOUT_MS = 3000;
const TYPING_THROTTLE_MS = 1500;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getDayDiff = (a: Date, b: Date): number => {
  const ta = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const tb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ta.getTime() - tb.getTime()) / DAY);
};

const formatTime = (date: Date): string =>
  date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const formatDateLabel = (date: Date): string => {
  const now = new Date();
  const diff = getDayDiff(now, date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  if (date.getFullYear() === now.getFullYear())
    return date.toLocaleDateString("en-US", { day: "numeric", month: "long" });
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
};

const isFileMessage = (content: string): boolean => Boolean(content && content.startsWith("[FILE:"));

const parseFileContent = (content: string): ParsedFile | null => {
  if (!content || !content.startsWith("[FILE:") || !content.endsWith("]")) return null;
  const inner = content.slice(6, -1);
  const newMatch = inner.match(/^(.*?):(.+):(img|file)(?::(\d+))?$/);
  if (newMatch) {
    const file: ParsedFile = { filename: newMatch[1], url: newMatch[2], type: newMatch[3] as "img" | "file" };
    if (newMatch[4]) {
      const dotIndex = file.filename.lastIndexOf(".");
      file.size = Number.parseInt(newMatch[4], 10);
      file.extension = dotIndex !== -1 && dotIndex !== 0 ? file.filename.slice(dotIndex + 1).toLowerCase() : "";
    }
    return file;
  }
  const oldMatch = inner.match(/^(.*?):(.+)$/);
  if (oldMatch) {
    const filename = oldMatch[1];
    const url = oldMatch[2];
    const isImage = /\.(jpg|jpeg|png|gif|webp)/i.test(url) || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
    return { filename, url, type: isImage ? "img" : "file" };
  }
  return null;
};

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "") + "/api";

const api = {
  get: async <T = unknown>(path: string, params?: Record<string, string | number | undefined | null>): Promise<{ data: T }> => {
    const token = localStorage.getItem("itsu_token");
    const url = new URL(API_BASE + path);
    if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) url.searchParams.set(k, String(v)); });
    const res = await fetch(url, { headers: { ...(token && { Authorization: `Bearer ${token}` }) } });
    if (!res.ok) throw new Error(`GET ${path} failed`);
    return { data: await res.json() };
  },
  post: async <T = unknown>(path: string, body?: unknown): Promise<{ data: T }> => {
    const token = localStorage.getItem("itsu_token");
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} failed`);
    return { data: await res.json() };
  },
  patch: async <T = unknown>(path: string, body?: unknown): Promise<{ data: T }> => {
    const token = localStorage.getItem("itsu_token");
    const res = await fetch(API_BASE + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed`);
    return { data: await res.json() };
  },
  delete: async <T = unknown>(path: string): Promise<{ data: T }> => {
    const token = localStorage.getItem("itsu_token");
    const res = await fetch(API_BASE + path, {
      method: "DELETE",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed`);
    return { data: await res.json() };
  },
  upload: async <T = unknown>(path: string, formData: FormData): Promise<{ data: T }> => {
    const token = localStorage.getItem("itsu_token");
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    if (!res.ok) throw new Error(`UPLOAD ${path} failed`);
    return { data: await res.json() };
  },
};

interface RawMessage {
  id: number;
  sender_pseudo?: string;
  sender_avatar?: string | null;
  sender_id: number;
  content: string;
  seen?: boolean;
  created_at: string;
  reactions?: Reaction[];
  reply_to_id?: number | null;
  reply_to_content?: string | null;
  reply_to_sender?: string | null;
}

function formatMsg(raw: RawMessage, currentUserId: number): Message {
  return {
    id: raw.id,
    sender: raw.sender_pseudo || "Unknown",
    senderAvatar: raw.sender_avatar || null,
    senderId: raw.sender_id,
    content: raw.content || "",
    own: raw.sender_id === currentUserId,
    seen: raw.seen || false,
    createdAt: raw.created_at,
    reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
    replyToId: raw.reply_to_id ?? null,
    replyToContent: raw.reply_to_content ?? null,
    replyToSender: raw.reply_to_sender ?? null,
  };
}

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  onClose: () => void;
}

function ReactionPicker({ onReact, onClose }: ReactionPickerProps) {
  return (
    <div
      className="flex items-center gap-0.5 bg-white rounded-full px-2 py-1.5 shadow-xl z-50 border border-gray-200"
      onMouseLeave={onClose}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => { e.stopPropagation(); onReact(emoji); onClose(); }}
          className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 active:scale-110 transition-transform rounded-full hover:bg-gray-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

interface ReactionListProps {
  reactions: Reaction[];
  currentUserId: number;
  onReact: (emoji: string) => void;
}

function ReactionList({ reactions, currentUserId, onReact }: ReactionListProps) {
  if (!reactions?.length) return null;
  const grouped = reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasOwn: false };
    acc[r.emoji].count++;
    if (r.userId === currentUserId) acc[r.emoji].hasOwn = true;
    return acc;
  }, {});
  return (
    <div className="flex flex-wrap gap-1 mt-1 px-1">
      {Object.entries(grouped).map(([emoji, { count, hasOwn }]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all active:scale-95 ${
            hasOwn
              ? "bg-red-50 border-red-200 text-red-600"
              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300"
          }`}
        >
          <span>{emoji}</span>
          <span className="font-semibold tabular-nums">{count}</span>
        </button>
      ))}
    </div>
  );
}

interface DateSeparatorProps {
  date: Date;
}

function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-gray-400 text-xs font-medium shrink-0 px-1">
        {formatDateLabel(date)}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

interface ReplyQuoteProps {
  replyToContent: string | null;
  replyToSender: string | null;
}

function ReplyQuote({ replyToContent, replyToSender }: ReplyQuoteProps) {
  if (!replyToContent) return null;
  const parsed = parseFileContent(replyToContent);
  const isImage = parsed?.type === "img";
  const isFile = parsed && !isImage;
  const preview = !parsed && replyToContent.length > 80 ? replyToContent.slice(0, 80) + "..." : replyToContent;
  return (
    <div className="flex items-stretch mb-1 rounded-xl overflow-hidden max-w-full text-xs bg-gray-50 border border-gray-100">
      <div className="w-[3px] shrink-0 bg-[#d1101b]" />
      <div className="flex items-center gap-2 flex-1 min-w-0 px-2.5 py-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#d1101b]/80 mb-0.5 truncate">↩ {replyToSender}</p>
          {isFile ? (
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <FileText size={10} className="shrink-0" />
              <span className="truncate">{parsed.filename}</span>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 truncate leading-snug">
              {isImage ? "📷 Image" : preview}
            </p>
          )}
        </div>
        {isImage && <img src={parsed.url} alt="" className="w-8 h-8 rounded-md object-cover shrink-0 opacity-70" />}
      </div>
    </div>
  );
}

interface ReplyBarProps {
  replyingTo: ReplyTarget | null;
  onCancel: () => void;
}

function ReplyBar({ replyingTo, onCancel }: ReplyBarProps) {
  if (!replyingTo) return null;
  const preview = replyingTo.content.length > 80 ? replyingTo.content.slice(0, 80) + "..." : replyingTo.content;
  return (
    <div className="absolute bottom-[calc(100%+0.5rem)] left-4 right-4 flex items-center gap-3 px-4 py-3 z-20 bg-white border border-gray-200 rounded-xl shadow-lg">
      <div className="w-0.5 self-stretch bg-[#d1101b] rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[#d1101b] text-xs font-bold mb-0.5 truncate">↩ {replyingTo.sender}</p>
        <p className="text-gray-400 text-xs truncate leading-snug">{preview}</p>
      </div>
      <button type="button" onClick={onCancel}
        className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-all shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

interface ImageMessageProps {
  parsed: ParsedFile;
  onClick: () => void;
}

function ImageMessage({ parsed, onClick }: ImageMessageProps) {
  return (
    <img src={parsed.url} alt={parsed.filename} onClick={onClick}
      className="max-w-[200px] sm:max-w-[320px] max-h-[300px] w-auto h-auto object-contain rounded-lg block bg-gray-100 cursor-pointer select-none"
      loading="lazy" draggable={false} />
  );
}

interface FileMessageProps {
  parsed: ParsedFile;
}

function FileMessage({ parsed }: FileMessageProps) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg max-w-full">
      <div className="flex flex-col items-center bg-gray-100 border border-gray-200 rounded-lg shrink-0 py-1.5 px-2">
        <FileText size={16} className="text-gray-500" />
        <span className="text-[8px] font-bold text-gray-500 uppercase">{parsed.extension || "file"}</span>
      </div>
      <div className="flex flex-col text-xs text-gray-500 min-w-0">
        <span className="truncate max-w-[120px]">{parsed.filename}</span>
        {parsed.size && <span>({(parsed.size / 1024).toFixed(1)} KB)</span>}
      </div>
    </div>
  );
}

interface TextMessageProps {
  msg: Message;
  isOwn: boolean;
  currentUserId: number;
  isFirst: boolean;
  onReact: (messageId: number, emoji: string) => void;
  onDelete: (msg: Message) => void;
  onImageClick: (img: LightboxImage) => void;
  onReply: (target: ReplyTarget) => void;
}

function TextMessage({ msg, isOwn, currentUserId, onReact, onDelete, onReply }: TextMessageProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const timeStr = formatTime(new Date(msg.createdAt));

  return (
    <div className={`group relative flex items-end gap-2 mb-2 max-w-[90%] sm:max-w-[70%] min-w-0 ${isOwn ? "flex-row-reverse self-end" : "flex-row self-start"}`}>
      <div className={`flex flex-col min-w-0 max-w-full ${isOwn ? "items-end" : "items-start"}`}>
        <ReplyQuote replyToContent={msg.replyToContent} replyToSender={msg.replyToSender} />

        <div className="relative">
          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-all ${isOwn ? "-left-[4.5rem]" : "-right-[4.5rem]"}`}>
            <button type="button"
              onClick={() => onReply({ id: msg.id, sender: isOwn ? "You" : msg.sender, content: msg.content })}
              className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
              title="Reply">
              <Reply size={12} />
            </button>
            <button type="button"
              onClick={() => setPickerOpen((p) => !p)}
              className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
              title="React">
              <Smile size={12} />
            </button>
          </div>

          {pickerOpen && (
            <div className={`absolute bottom-full mb-1 z-50 ${isOwn ? "right-0" : "left-0"}`}>
              <ReactionPicker
                onReact={(emoji) => { onReact(msg.id, emoji); setPickerOpen(false); }}
                onClose={() => setPickerOpen(false)}
              />
            </div>
          )}

          <div className={`px-4 py-2 text-sm leading-relaxed select-none ${
            isOwn
              ? "bg-gradient-to-r from-[#d1101b] to-[#9a2a52] text-white rounded-2xl rounded-br-md shadow-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-md shadow-sm"
          }`}>
            <span className="break-words whitespace-pre-wrap">{msg.content}</span>
          </div>
        </div>

        <ReactionList reactions={msg.reactions} currentUserId={currentUserId}
          onReact={(emoji) => onReact(msg.id, emoji)} />

        <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-gray-400">{timeStr}</span>
          {isOwn && (
            <>
              <span className={`text-[10px] ${msg.seen ? "text-[#d1101b]" : "text-gray-300"}`}>
                {msg.seen ? "✓✓" : "✓"}
              </span>
              <button type="button" onClick={() => onDelete(msg)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-[10px] ml-1"
                title="Delete">
                <Trash2 size={10} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface MediaMessageProps {
  msg: Message;
  isOwn: boolean;
  currentUserId: number;
  onReact: (messageId: number, emoji: string) => void;
  onDelete: (msg: Message) => void;
  onImageClick: (img: LightboxImage) => void;
  onReply: (target: ReplyTarget) => void;
}

function MediaMessage({ msg, isOwn, currentUserId, onReact, onImageClick, onReply }: MediaMessageProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const parsed = parseFileContent(msg.content);
  const isImage = parsed?.type === "img";
  const timeStr = formatTime(new Date(msg.createdAt));

  return (
    <div className={`group relative flex items-end gap-2 mb-2 max-w-[90%] sm:max-w-[70%] min-w-0 ${isOwn ? "flex-row-reverse self-end" : "flex-row self-start"}`}>
      <div className={`flex flex-col min-w-0 max-w-full ${isOwn ? "items-end" : "items-start"}`}>
        <div className="relative">
          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-all ${isOwn ? "-left-[4.5rem]" : "-right-[4.5rem]"}`}>
            <button type="button"
              onClick={() => onReply({ id: msg.id, sender: isOwn ? "You" : msg.sender, content: msg.content })}
              className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
              title="Reply">
              <Reply size={12} />
            </button>
            <button type="button"
              onClick={() => setPickerOpen((p) => !p)}
              className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
              title="React">
              <Smile size={12} />
            </button>
          </div>

          {pickerOpen && (
            <div className={`absolute bottom-full mb-1 z-50 ${isOwn ? "right-0" : "left-0"}`}>
              <ReactionPicker
                onReact={(emoji) => { onReact(msg.id, emoji); setPickerOpen(false); }}
                onClose={() => setPickerOpen(false)}
              />
            </div>
          )}

          <div className="rounded-2xl overflow-hidden bg-white border border-gray-100">
            {isImage && parsed ? (
              <ImageMessage parsed={parsed} onClick={() => onImageClick({ url: parsed.url, filename: parsed.filename })} />
            ) : parsed ? (
              <FileMessage parsed={parsed} />
            ) : null}
          </div>
        </div>

        <ReactionList reactions={msg.reactions} currentUserId={currentUserId}
          onReact={(emoji) => onReact(msg.id, emoji)} />

        <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-gray-400">{timeStr}</span>
          {isOwn && (
            <span className={`text-[10px] ${msg.seen ? "text-[#d1101b]" : "text-gray-300"}`}>
              {msg.seen ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessageGroupProps {
  messages: Message[];
  onDelete: (msg: Message) => void;
  onImageClick: (img: LightboxImage) => void;
  onReact: (messageId: number, emoji: string) => void;
  onReply: (target: ReplyTarget) => void;
  currentUserId: number;
}

function MessageGroup({ messages, onDelete, onImageClick, onReact, onReply, currentUserId }: MessageGroupProps) {
  return (
    <div className={`flex flex-col ${messages[0]?.own ? "items-end" : "items-start"}`}>
      {messages.map((msg, idx) => {
        if (isFileMessage(msg.content)) {
          return (
            <MediaMessage key={msg.id} msg={msg} isOwn={msg.own}
              currentUserId={currentUserId}
              onReact={onReact} onDelete={onDelete}
              onImageClick={onImageClick} onReply={onReply} />
          );
        }
        return (
          <TextMessage key={msg.id} msg={msg} isOwn={msg.own} isFirst={idx === 0}
            currentUserId={currentUserId}
            onReact={onReact} onDelete={onDelete}
            onImageClick={onImageClick} onReply={onReply} />
        );
      })}
    </div>
  );
}

interface DeleteMessageDialogProps {
  message: Message | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteMessageDialog({ message, deleting, onCancel, onConfirm }: DeleteMessageDialogProps) {
  if (!message) return null;
  const preview = message.content.length > 80 ? message.content.slice(0, 80) + "..." : message.content;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <Trash2 size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-fredoka font-bold text-gray-900 text-base">Delete this message?</h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">This action is permanent.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={deleting}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition disabled:opacity-40">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wide mb-1">Preview</p>
            <p className="text-gray-600 text-sm leading-relaxed break-words">{preview}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button type="button" onClick={onCancel} disabled={deleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-40">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
            {deleting && <Loader size={12} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const EMOJIS = ["😀","😍","🥰","😘","😊","😉","😌","😏","🤗","🫶","😢","😭","😤","😠","🥺","😰","😅","😂","🤣","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💕","💗","💖","✨","🔥","🎉","🎊","🙏","👋","✌️","🤞","💪","🫂","🌹","🌸","💐","🍕","🌮","☕","🎂","🎁","💝","👑","⭐","🌙","☀️","🌈","🦋","🌻","🌺","🍀","🎵","🎶","💫","⚡","💯","✅","❌","➕","➖","💀","👻","🎃","🫶🏻"];

interface EmojiPickerPopupProps {
  onEmojiClick: (emoji: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

function EmojiPickerPopup({ onEmojiClick, onClose, anchorRef }: EmojiPickerPopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [onClose, anchorRef]);

  return (
    <div ref={ref}
      className="absolute bottom-full left-0 mb-3 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 w-[280px] sm:w-[320px] max-h-[260px] overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500">Emoji</span>
        <button type="button" onClick={onClose}
          className="w-6 h-6 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-all">
          <X size={12} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {EMOJIS.map((emoji) => (
          <button key={emoji} type="button"
            onClick={() => { onEmojiClick(emoji); onClose(); }}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors active:scale-90">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

interface UploadResponse {
  filename: string;
  url: string;
  isImage: boolean;
}

interface ContactUser {
  id: number;
  pseudo: string;
  role?: string;
  ref?: string;
  level?: string;
  avatar?: string | null;
}

interface ContactResponse {
  users?: ContactUser[];
  total?: number;
}

export default function ChatPage() {
  const [currentUser] = useState({ id: 1, pseudo: "You" });
  const [partner] = useState({ id: 2, pseudo: "Partner", avatar: null as string | null });
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<LightboxImage | null>(null);
  const [online, setOnline] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const [socketState, setSocketState] = useState("connecting");

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const prevScrollHeight = useRef(0);
  const prevMsgCount = useRef(0);
  const isAtBottomRef = useRef(true);

  useEffect(() => { isAtBottomRef.current = isAtBottom; }, [isAtBottom]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const s = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
          auth: { token: localStorage.getItem("itsu_token") },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000,
          reconnectionAttempts: 15,
          timeout: 15000,
        });

        if (cancelled) { s.disconnect(); return; }
        socketRef.current = s;

        s.on("connect", () => { setSocketState("connected"); s.emit("user:join", currentUser.id); });
        s.on("disconnect", () => setSocketState("disconnected"));
        s.on("reconnect_attempt", () => setSocketState("reconnecting"));
        s.on("reconnect_failed", () => setSocketState("reconnect_failed"));
        s.on("connect_error", () => setSocketState("connect_error"));

        s.on("user:online", (userId: number) => {
          if (String(userId) === String(partner.id)) setOnline(true);
        });
        s.on("user:offline", (userId: number) => {
          if (String(userId) === String(partner.id)) setOnline(false);
        });

        s.on("message:private", (data: RawMessage) => {
          const msg = formatMsg(data, currentUser.id);
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (!msg.own && !document.hidden && Notification.permission === "granted") {
            new Notification("Message from " + msg.sender, {
              body: msg.content.replace(/\[FILE:.+\]/, "[File]"),
              icon: "/logo.png",
            });
          }
        });

        s.on("message:seen", ({ messageId }: { messageId: number }) => {
          setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, seen: true } : m));
        });

        s.on("message:deleted", ({ messageId }: { messageId: number }) => {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        });

        s.on("typing:started", ({ userId, pseudo }: { userId: number; pseudo: string }) => {
          if (String(userId) === String(partner.id)) {
            setTypingUsers((prev) => ({ ...prev, [userId]: pseudo }));
          }
        });

        s.on("typing:stopped", ({ userId }: { userId: number }) => {
          if (String(userId) === String(partner.id)) {
            setTypingUsers((prev) => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });
          }
        });

        s.on("message:reaction", ({ messageId, reactions }: { messageId: number; reactions: Reaction[] }) => {
          setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions } : m));
        });
      } catch (err) {
        console.error("Socket init error:", err);
        setSocketState("connect_error");
      }
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typingUsersList = useMemo(() => Object.values(typingUsers).filter(Boolean), [typingUsers]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<Message[] | { messages: Message[] }>(`/messages/private/${partner.id}`, { limit: "100" });
        const msgList = Array.isArray(data) ? data : (data as { messages: Message[] }).messages;
        if (Array.isArray(msgList)) {
          setMessages(msgList.map((m) => formatMsg(m as unknown as RawMessage, currentUser.id)));
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [partner.id, currentUser.id]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<ContactUser[] | ContactResponse>("/messages/contacts", { limit: "200" });
        const users = Array.isArray(data) ? data : (data as ContactResponse).users;
        if (Array.isArray(users)) {
          const found = users.find((u) => String(u.id) === String(partner.id));
          if (found) setOnline(true);
        }
      } catch {
        // online remains false
      }
    })();
  }, [partner.id]);

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const el = scrollRef.current;
      if (el && !isAtBottom) {
        el.scrollTop = el.scrollHeight - prevScrollHeight.current;
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, isAtBottom]);

  const prevPartnerRef = useRef(partner.id);
  useEffect(() => {
    if (prevPartnerRef.current !== partner.id) {
      setShowEmojiPicker(false);
      setReplyingTo(null);
      prevPartnerRef.current = partner.id;
    }
  }, [partner.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setReplyingTo(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);

    if (el.scrollTop < 80 && messages.length > 0 && !loadingOlder) {
      prevScrollHeight.current = el.scrollHeight;
      setLoadingOlder(true);
      loadOlderMessages().finally(() => setLoadingOlder(false));
    }
  };

  const loadOlderMessages = async () => {
    if (messages.length === 0) return;
    const oldestId = messages[0].id;
    try {
      const { data } = await api.get<Message[] | { messages: Message[] }>(`/messages/private/${partner.id}`, { before: String(oldestId), limit: "100" });
      const msgList = Array.isArray(data) ? data : (data as { messages: Message[] }).messages;
      if (!Array.isArray(msgList) || msgList.length === 0) return;
      const older = msgList.map((m) => formatMsg(m as unknown as RawMessage, currentUser.id)).reverse();
      setMessages((prev) => [...older, ...prev]);
    } catch (err) {
      console.error("Failed to load older messages:", err);
    }
  };

  const emitTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current?.connected) return;
    const now = Date.now();
    if (isTyping && now - lastTypingEmitRef.current < TYPING_THROTTLE_MS) return;
    lastTypingEmitRef.current = now;
    try {
      socketRef.current.emit(isTyping ? "typing:started" : "typing:stopped", {
        contactId: partner.id,
        isGlobal: false,
      });
    } catch {
      // silently fail
    }
  }, [partner.id]);

  const handleTyping = (val: string) => {
    setText(val);
    if (error) setError("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTyping(val.length > 0);
    if (val.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(false);
      }, TYPING_TIMEOUT_MS);
    }
  };

  const handleSend = async () => {
    setError("");
    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;
    setSending(true);
    try {
      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const { data: uploadData } = await api.upload<UploadResponse>("/messages/upload", fd);
        await api.post("/messages", {
          content: `[FILE:${uploadData.filename}:${uploadData.url}:${uploadData.isImage ? "img" : "file"}:${selectedFile.size}]`,
          receiver_id: partner.id,
          is_global: false,
          reply_to_id: replyingTo?.id ?? null,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
      }

      if (trimmed) {
        await api.post("/messages", {
          content: trimmed,
          receiver_id: partner.id,
          is_global: false,
          reply_to_id: replyingTo?.id ?? null,
        });
      }

      setText("");
      setReplyingTo(null);
      setShowEmojiPicker(false);
      emitTyping(false);
    } catch {
      setError("Failed to send message.");
    } finally {
      setSending(false);
      setIsAtBottom(true);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large (max 10 MB).");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    e.target.value = "";
  };

  const handleReact = useCallback(async (messageId: number, emoji: string) => {
    try {
      setMessages((prev) => prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions || [];
        const mine = reactions.find((r) => r.userId === currentUser.id);
        let newReactions: Reaction[];
        if (!mine) {
          newReactions = [...reactions, { userId: currentUser.id, userName: currentUser.pseudo, emoji }];
        } else if (mine.emoji === emoji) {
          newReactions = reactions.filter((r) => r.userId !== currentUser.id);
        } else {
          newReactions = reactions.map((r) => r.userId === currentUser.id ? { ...r, emoji } : r);
        }
        return { ...m, reactions: newReactions };
      }));
      await api.post(`/messages/${messageId}/reactions`, { emoji });
    } catch (err) {
      console.error("Reaction error:", err);
    }
  }, [currentUser.id, currentUser.pseudo]);

  const confirmDelete = async () => {
    if (!deleteTarget || deletingMessage) return;
    setDeletingMessage(true);
    try {
      await api.delete(`/messages/${deleteTarget.id}`);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingMessage(false);
    }
  };

  const grouped: GroupItem[] = useMemo(() => {
    if (!messages.length) return [];
    const result: GroupItem[] = [];
    let currentGroup: { isOwn: boolean; messages: Message[] } | null = null;
    let lastDate: Date | null = null;

    for (const msg of messages) {
      const msgDate = new Date(msg.createdAt);
      if (lastDate && !isSameDay(msgDate, lastDate)) {
        result.push({ type: "separator", date: msgDate });
      }
      lastDate = msgDate;

      if (!currentGroup) {
        currentGroup = { isOwn: msg.own, messages: [msg] };
      } else {
        const prev = currentGroup.messages[currentGroup.messages.length - 1];
        const prevDate = new Date(prev.createdAt);
        const gap = msgDate.getTime() - prevDate.getTime();

        if (msg.own === currentGroup.isOwn && msg.sender === prev.sender && gap > 0 && gap < GROUP_GAP) {
          currentGroup.messages.push(msg);
        } else {
          result.push({ type: "group", ...currentGroup });
          currentGroup = { isOwn: msg.own, messages: [msg] };
        }
      }
    }
    if (currentGroup) result.push({ type: "group", ...currentGroup });
    return result;
  }, [messages]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-nunito p-6 lg:p-10">
      <div className="max-w-4xl mx-auto h-[calc(100vh-5rem)] lg:h-[calc(100vh-5rem)] flex flex-col">

        <div className="bg-white rounded-t-3xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d1101b] to-[#9a2a52] flex items-center justify-center text-white font-fredoka font-bold text-lg shrink-0">
                {partner.pseudo?.[0] || "P"}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-300"}`} />
            </div>
            <div>
              <h2 className="font-fredoka font-bold text-gray-900">{partner.pseudo}</h2>
              <p className="text-xs font-semibold flex items-center gap-1">
                {typingUsersList.length > 0 ? (
                  <span className="text-[#d1101b] animate-pulse">{typingUsersList[0]} is typing...</span>
                ) : (
                  <span className={online ? "text-green-500" : "text-gray-400"}>
                    {online ? "Online" : "Offline"}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {socketState !== "connected" && socketState !== "connecting" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                <WifiOff size={12} className="text-amber-500" />
                <span className="text-[10px] text-amber-600 font-semibold">
                  {socketState === "reconnecting" ? "Reconnecting..." : "Offline"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div ref={scrollRef} onScroll={handleScroll}
          className="flex-1 bg-white border-x border-gray-100 overflow-y-auto px-6 py-4 flex flex-col">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader size={24} className="text-[#d1101b] animate-spin" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40 select-none">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Send size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">No messages yet. Say hello! 👋</p>
            </div>
          )}

          {loadingOlder && (
            <div className="flex justify-center py-4">
              <Loader size={16} className="text-[#d1101b] animate-spin" />
            </div>
          )}

          {!loading && grouped.map((item, idx) =>
            item.type === "separator" ? (
              <DateSeparator key={`sep-${idx}`} date={item.date} />
            ) : (
              <div key={`g-${idx}`} className="mb-2 last:mb-0">
                <MessageGroup
                  messages={item.messages}
                  onDelete={(msg) => setDeleteTarget(msg)}
                  onImageClick={setLightboxImg}
                  onReact={handleReact}
                  onReply={setReplyingTo}
                  currentUserId={currentUser.id}
                />
              </div>
            )
          )}

          <div ref={bottomRef} />

          {!isAtBottom && messages.length > 0 && (
            <button type="button"
              onClick={() => { setIsAtBottom(true); bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className="fixed bottom-32 right-6 lg:right-12 w-11 h-11 rounded-full bg-white border border-gray-200 text-gray-500 flex items-center justify-center hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-lg z-10"
              title="Scroll to bottom">
              <ChevronDown size={16} />
            </button>
          )}
        </div>

        <div className="relative bg-white rounded-b-3xl border border-gray-100 shadow-sm px-4 py-4 shrink-0">
          {error && (
            <div className="absolute bottom-[calc(100%+0.5rem)] right-4 px-4 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 cursor-pointer"
              onClick={() => setError("")}>
              <span className="text-xs text-red-600">{error}</span>
            </div>
          )}

          {selectedFile && (
            <div className="absolute bottom-[calc(100%+0.5rem)] left-4 p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-4 shadow-lg">
              <div className="relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg ring-2 ring-gray-100" />
                ) : (
                  <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center ring-2 ring-gray-100">
                    <FileText size={24} className="text-gray-400" />
                  </div>
                )}
                <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-400 transition-colors shadow-lg">
                  <X size={10} />
                </button>
              </div>
              <div className="flex flex-col min-w-[120px] max-w-[200px]">
                <span className="text-sm text-gray-700 font-medium truncate">{selectedFile.name}</span>
                <span className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )}

          <ReplyBar replyingTo={replyingTo} onCancel={() => setReplyingTo(null)} />

          <div className="relative flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-[#d1101b] focus-within:ring-1 focus-within:ring-[#d1101b]/20 transition-all">
            {showEmojiPicker && (
              <EmojiPickerPopup
                onEmojiClick={(emoji) => {
                  setText((prev) => prev + emoji);
                  inputRef.current?.focus();
                }}
                onClose={() => setShowEmojiPicker(false)}
                anchorRef={emojiButtonRef}
              />
            )}

            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-10 h-10 rounded-xl text-gray-400 hover:text-[#d1101b] hover:bg-red-50 flex items-center justify-center transition-all shrink-0 active:scale-90"
              title="Attach file">
              <Paperclip size={16} />
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

            <button ref={emojiButtonRef} type="button" onClick={() => setShowEmojiPicker((o) => !o)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-90 ${
                showEmojiPicker ? "bg-[#d1101b] text-white" : "text-gray-400 hover:text-[#d1101b] hover:bg-red-50"
              }`}
              title="Add emoji">
              <Smile size={16} />
            </button>

            <input ref={inputRef}
              className="flex-1 min-w-0 text-sm text-gray-800 bg-transparent focus:outline-none placeholder:text-gray-400"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKey}
            />

            <button type="button" onClick={handleSend}
              disabled={(!text.trim() && !selectedFile) || sending}
              className="w-11 h-11 rounded-2xl bg-gradient-to-r from-[#d1101b] to-[#9a2a52] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all shrink-0 active:scale-95">
              {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      <DeleteMessageDialog
        message={deleteTarget}
        deleting={deletingMessage}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {lightboxImg && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImg(null)}>
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 text-white z-10"
            onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-medium truncate max-w-[60%]">{lightboxImg.filename}</span>
            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); window.open(lightboxImg.url, "_blank"); }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                title="Download image">
                <Download size={14} />
              </button>
              <button onClick={() => setLightboxImg(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                title="Close">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="relative max-w-full max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImg.url} alt={lightboxImg.filename}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl select-none" />
          </div>
        </div>
      )}
    </div>
  );
}
