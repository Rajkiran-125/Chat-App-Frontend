import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { SocketService } from './socket.service';
import { ToastService } from './toast.service';
import {
  Message,
  MessageStatusEvent,
  MessageType,
  PresenceUpdate,
  SidebarUser,
  TypingEvent
} from '../models/chat.models';

const STATUS_RANK = { sending: 0, failed: 0, sent: 1, delivered: 2, read: 3 } as const;
const MAX_IMAGE_DATA_URL = 700_000;

/**
 * Single source of truth for chat state: the sidebar, the active
 * conversation, its messages, presence and typing. Components only render
 * streams from here - no state lives in components.
 */
@Injectable({ providedIn: 'root' })
export class ChatStoreService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private socket = inject(SocketService);
  private toast = inject(ToastService);

  private readonly usersSubject = new BehaviorSubject<SidebarUser[]>([]);
  readonly users$ = this.usersSubject.asObservable();

  private readonly loadingUsersSubject = new BehaviorSubject<boolean>(false);
  readonly loadingUsers$ = this.loadingUsersSubject.asObservable();

  private readonly activeChatSubject = new BehaviorSubject<SidebarUser | null>(null);
  readonly activeChat$ = this.activeChatSubject.asObservable();

  private readonly messagesSubject = new BehaviorSubject<Message[]>([]);
  readonly messages$ = this.messagesSubject.asObservable();

  private readonly loadingMessagesSubject = new BehaviorSubject<boolean>(false);
  readonly loadingMessages$ = this.loadingMessagesSubject.asObservable();

  /** roomIds in which the other user is currently typing */
  private readonly typingSubject = new BehaviorSubject<ReadonlySet<string>>(new Set());
  readonly typing$ = this.typingSubject.asObservable();

  private subscriptions = new Subscription();
  private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private myTypingTimer: ReturnType<typeof setTimeout> | null = null;
  private tempIdCounter = 1;
  private initialized = false;
  private hadFirstConnect = false;

  get activeChat(): SidebarUser | null {
    return this.activeChatSubject.value;
  }

  /** Connect the socket and wire all realtime listeners. Idempotent. */
  init(): void {
    if (this.initialized || !this.auth.token) return;
    this.initialized = true;

    this.socket.connect(this.auth.token);

    this.subscriptions.add(
      this.socket.on<Message>('message:new').subscribe((msg) => this.onIncomingMessage(msg))
    );
    this.subscriptions.add(
      this.socket.on<MessageStatusEvent>('message:status').subscribe((evt) => this.onStatusUpdate(evt))
    );
    this.subscriptions.add(
      this.socket.on<PresenceUpdate[]>('presence:list').subscribe((list) => this.onPresenceList(list))
    );
    this.subscriptions.add(
      this.socket.on<PresenceUpdate>('presence:update').subscribe((p) => this.onPresenceUpdate(p))
    );
    this.subscriptions.add(
      this.socket.on<TypingEvent>('typing').subscribe((evt) => this.onTyping(evt))
    );
    // After a reconnect, rejoin the room and resync everything we may have missed.
    this.subscriptions.add(
      this.socket.on<void>('connect').subscribe(() => {
        if (!this.hadFirstConnect) {
          this.hadFirstConnect = true;
          return;
        }
        const active = this.activeChat;
        if (active?.roomId) {
          this.socket.emit('room:join', { roomId: active.roomId });
          this.reloadActiveHistory(active.roomId);
        }
        this.loadUsers();
      })
    );

    this.loadUsers();
  }

  /** Full reset - used on logout. */
  teardown(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.socket.disconnect();
    this.typingTimers.forEach((t) => clearTimeout(t));
    this.typingTimers.clear();
    if (this.myTypingTimer) clearTimeout(this.myTypingTimer);
    this.myTypingTimer = null;
    this.usersSubject.next([]);
    this.activeChatSubject.next(null);
    this.messagesSubject.next([]);
    this.typingSubject.next(new Set());
    this.initialized = false;
    this.hadFirstConnect = false;
  }

  loadUsers(): void {
    this.loadingUsersSubject.next(true);
    this.api.users().subscribe({
      next: ({ users }) => {
        this.usersSubject.next(users);
        this.loadingUsersSubject.next(false);
      },
      error: () => {
        this.loadingUsersSubject.next(false);
        this.toast.error('Could not load your chats. Retrying may help.');
      }
    });
  }

  /** Open (or create) the DM with a user and load its history. */
  async openChat(user: SidebarUser): Promise<void> {
    if (this.activeChat?.id === user.id) return;

    const previous = this.activeChat;
    if (previous?.roomId) {
      this.socket.emit('room:leave', { roomId: previous.roomId });
    }

    let roomId = user.roomId;
    this.messagesSubject.next([]);
    this.loadingMessagesSubject.next(true);
    this.activeChatSubject.next({ ...user });

    try {
      if (!roomId) {
        const { room } = await firstValueFrom(this.api.openRoom(user.id));
        roomId = room.id;
        this.patchUser(user.id, { roomId });
      }
      this.activeChatSubject.next({ ...user, roomId });
      this.socket.emit('room:join', { roomId });

      const page = await firstValueFrom(this.api.history(roomId));
      // Ignore stale responses if the user already switched chats.
      if (this.activeChat?.roomId === roomId) {
        this.messagesSubject.next(page.messages);
        this.markRoomRead(roomId);
      }
    } catch {
      this.toast.error('Could not open this conversation.');
      this.activeChatSubject.next(null);
    } finally {
      this.loadingMessagesSubject.next(false);
    }
  }

  /** Mobile back button / deselect. */
  closeChat(): void {
    const active = this.activeChat;
    if (active?.roomId) {
      this.socket.emit('room:leave', { roomId: active.roomId });
    }
    this.activeChatSubject.next(null);
    this.messagesSubject.next([]);
  }

  async sendText(content: string): Promise<void> {
    const text = content.trim();
    if (!text) return;
    await this.send('text', text);
  }

  /** Downscale + compress an image file, then send it as a data-URL message. */
  async sendImage(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.toast.error('Only image files are supported.');
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      if (dataUrl.length > MAX_IMAGE_DATA_URL) {
        this.toast.error('Image is too large even after compression.');
        return;
      }
      await this.send('image', dataUrl);
    } catch {
      this.toast.error('Could not read that image.');
    }
  }

  /** Notify the other user that I'm typing (auto-stops after a pause). */
  notifyTyping(): void {
    const roomId = this.activeChat?.roomId;
    if (!roomId) return;
    if (!this.myTypingTimer) {
      this.socket.emit('typing', { roomId, isTyping: true });
    } else {
      clearTimeout(this.myTypingTimer);
    }
    this.myTypingTimer = setTimeout(() => {
      this.myTypingTimer = null;
      this.socket.emit('typing', { roomId, isTyping: false });
    }, 2000);
  }

  retryMessage(message: Message): void {
    if (message.status !== 'failed') return;
    this.messagesSubject.next(this.messagesSubject.value.filter((m) => m.id !== message.id));
    void this.send(message.type, message.content);
  }

  private async send(type: MessageType, content: string): Promise<void> {
    const me = this.auth.currentUser;
    const roomId = this.activeChat?.roomId;
    if (!me || !roomId) return;

    const temp: Message = {
      id: `tmp-${this.tempIdCounter++}`,
      roomId,
      senderId: me.id,
      senderName: me.userName,
      type,
      content,
      status: 'sending',
      createdAt: new Date().toISOString()
    };
    this.appendMessage(temp);

    try {
      const ack = await this.socket.emitWithAck<{ ok: boolean; message?: Message; message_text?: string }>(
        'message:send',
        { roomId, type, content }
      );
      if (ack.ok && ack.message) {
        this.replaceMessage(temp.id, ack.message);
        this.updateSidebarForMessage(ack.message);
      } else {
        this.replaceMessage(temp.id, { ...temp, status: 'failed' });
        this.toast.error('Message was rejected by the server.');
      }
    } catch {
      this.replaceMessage(temp.id, { ...temp, status: 'failed' });
      this.toast.error('Message not sent. Check your connection and tap to retry.');
    }
  }

  // ----- socket event handlers -------------------------------------------

  private onIncomingMessage(msg: Message): void {
    const me = this.auth.currentUser;
    const isMine = msg.senderId === me?.id;

    if (!isMine) {
      this.socket.emit('message:delivered', { roomId: msg.roomId, messageId: msg.id });
    }

    if (this.activeChat?.roomId === msg.roomId) {
      this.appendMessage(msg);
      if (!isMine) this.markRoomRead(msg.roomId);
      this.updateSidebarForMessage(msg, 0);
    } else {
      this.updateSidebarForMessage(msg, isMine ? 0 : 1);
    }
  }

  private onStatusUpdate(evt: MessageStatusEvent): void {
    if (this.activeChat?.roomId === evt.roomId) {
      const ids = new Set(evt.messageIds);
      this.messagesSubject.next(
        this.messagesSubject.value.map((m) =>
          ids.has(m.id) && STATUS_RANK[evt.status] > STATUS_RANK[m.status]
            ? { ...m, status: evt.status }
            : m
        )
      );
    }
    // Keep the sidebar preview's tick in sync too.
    this.usersSubject.next(
      this.usersSubject.value.map((u) =>
        u.roomId === evt.roomId &&
        u.lastMessage &&
        evt.messageIds.includes(u.lastMessage.id) &&
        STATUS_RANK[evt.status] > STATUS_RANK[u.lastMessage.status]
          ? { ...u, lastMessage: { ...u.lastMessage, status: evt.status } }
          : u
      )
    );
  }

  private onPresenceList(list: PresenceUpdate[]): void {
    const byId = new Map(list.map((p) => [p.userId, p]));
    this.usersSubject.next(
      this.usersSubject.value.map((u) => {
        const p = byId.get(u.id);
        return p ? { ...u, online: p.online, lastSeenAt: p.lastSeenAt ?? u.lastSeenAt } : u;
      })
    );
    const active = this.activeChat;
    if (active) {
      const p = byId.get(active.id);
      if (p) {
        this.activeChatSubject.next({ ...active, online: p.online, lastSeenAt: p.lastSeenAt ?? active.lastSeenAt });
      }
    }
  }

  private onPresenceUpdate(p: PresenceUpdate): void {
    this.patchUser(p.userId, { online: p.online, lastSeenAt: p.lastSeenAt });
    const active = this.activeChat;
    if (active?.id === p.userId) {
      this.activeChatSubject.next({ ...active, online: p.online, lastSeenAt: p.lastSeenAt });
    }
  }

  private onTyping(evt: TypingEvent): void {
    const current = new Set(this.typingSubject.value);
    const existing = this.typingTimers.get(evt.roomId);
    if (existing) clearTimeout(existing);

    if (evt.isTyping) {
      current.add(evt.roomId);
      // Safety net: clear even if the stop event never arrives.
      this.typingTimers.set(
        evt.roomId,
        setTimeout(() => {
          const next = new Set(this.typingSubject.value);
          next.delete(evt.roomId);
          this.typingSubject.next(next);
          this.typingTimers.delete(evt.roomId);
        }, 3500)
      );
    } else {
      current.delete(evt.roomId);
      this.typingTimers.delete(evt.roomId);
    }
    this.typingSubject.next(current);
  }

  // ----- helpers ----------------------------------------------------------

  private markRoomRead(roomId: string): void {
    this.socket.emit('message:read', { roomId });
    this.usersSubject.next(
      this.usersSubject.value.map((u) => (u.roomId === roomId ? { ...u, unreadCount: 0 } : u))
    );
  }

  private appendMessage(msg: Message): void {
    const messages = this.messagesSubject.value;
    if (messages.some((m) => m.id === msg.id)) return;
    this.messagesSubject.next([...messages, msg]);
  }

  private replaceMessage(id: string, replacement: Message): void {
    this.messagesSubject.next(
      this.messagesSubject.value.map((m) => (m.id === id ? replacement : m))
    );
  }

  private patchUser(userId: string, patch: Partial<SidebarUser>): void {
    this.usersSubject.next(
      this.usersSubject.value.map((u) => (u.id === userId ? { ...u, ...patch } : u))
    );
  }

  /** Update lastMessage/unread for the affected chat and float it to the top. */
  private updateSidebarForMessage(msg: Message, unreadDelta = 0): void {
    const me = this.auth.currentUser;
    const otherUserId = msg.senderId === me?.id ? undefined : msg.senderId;

    const users = this.usersSubject.value.map((u) => {
      const matches = u.roomId === msg.roomId || (otherUserId ? u.id === otherUserId : false);
      if (!matches) return u;
      return {
        ...u,
        roomId: u.roomId ?? msg.roomId,
        lastMessage: msg,
        unreadCount: Math.max(0, u.unreadCount + unreadDelta)
      };
    });
    users.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ?? a.createdAt ?? '';
      const timeB = b.lastMessage?.createdAt ?? b.createdAt ?? '';
      return timeB.localeCompare(timeA);
    });
    this.usersSubject.next(users);
  }

  private reloadActiveHistory(roomId: string): void {
    this.api.history(roomId).subscribe({
      next: (page) => {
        if (this.activeChat?.roomId === roomId) {
          this.messagesSubject.next(page.messages);
          this.markRoomRead(roomId);
        }
      },
      error: () => undefined
    });
  }
}

/** Downscale to <=1280px and encode as JPEG (or keep PNG for small images). */
function compressImage(file: File, maxDimension = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas unavailable'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
