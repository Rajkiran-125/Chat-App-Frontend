export interface User {
  id: string;
  userName: string;
  phone: string;
  avatar: string;
  createdAt?: string;
  lastSeenAt?: string | null;
}

/**
 * A sidebar entry: another user + my DM room with them (if any).
 * `phone` is intentionally absent — the server never exposes other users'
 * phone numbers (they are a login credential).
 */
export interface SidebarUser extends Omit<User, 'phone'> {
  online: boolean;
  roomId: string | null;
  lastMessage: Message | null;
  unreadCount: number;
}

export type MessageType = 'text' | 'image';

/** 'sending' and 'failed' exist only on the client (optimistic send). */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  status: MessageStatus;
  createdAt: string;
  /** Client-generated id for optimistic sends + server-side idempotency. */
  clientId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MessagesPage {
  messages: Message[];
  hasMore: boolean;
}

export interface PresenceUpdate {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}

export interface TypingEvent {
  roomId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface MessageStatusEvent {
  roomId: string;
  messageIds: string[];
  status: 'delivered' | 'read';
}
