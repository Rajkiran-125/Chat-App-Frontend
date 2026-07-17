import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest, map } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { ChatStoreService } from 'src/app/core/services/chat-store.service';
import { Message } from 'src/app/core/models/chat.models';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { TimeAgoPipe } from 'src/app/shared/pipes/time-ago.pipe';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';

/** Flattened render list: date separators between day changes. */
interface FeedItem {
  kind: 'separator' | 'message';
  label?: string;
  message?: Message;
  firstOfGroup?: boolean;
  lastOfGroup?: boolean;
}

@Component({
    selector: 'app-conversation',
    imports: [
        CommonModule,
        FormsModule,
        AvatarComponent,
        TimeAgoPipe,
        MessageBubbleComponent,
        EmojiPickerComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './conversation.component.html',
    styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent implements AfterViewInit, OnDestroy {
  store = inject(ChatStoreService);
  auth = inject(AuthService);

  @Output() profileClick = new EventEmitter<void>();
  @Output() imageClick = new EventEmitter<string>();

  @ViewChild('feed') private feedRef?: ElementRef<HTMLElement>;
  @ViewChild('messageInput') private inputRef?: ElementRef<HTMLTextAreaElement>;

  messageText = '';
  emojiOpen = false;
  pendingImage: { file: File; previewUrl: string } | null = null;

  readonly feed$ = this.store.messages$.pipe(map((messages) => buildFeed(messages)));

  /** True when the person in the ACTIVE chat is typing. */
  readonly activeTyping$ = combineLatest([this.store.activeChat$, this.store.typing$]).pipe(
    map(([chat, typing]) => !!chat?.roomId && typing.has(chat.roomId))
  );

  private subscription = new Subscription();
  private lastMessageId: string | null = null;

  ngAfterViewInit(): void {
    // Auto-scroll rules: jump to the bottom for my own new message, otherwise
    // only if the user is already near the bottom (don't yank them away from
    // older messages they're reading). Status-only changes never scroll.
    this.subscription.add(
      this.store.messages$.subscribe((messages) => {
        const last = messages[messages.length - 1];
        const isNewMessage = !!last && last.id !== this.lastMessageId;
        this.lastMessageId = last ? last.id : null;
        if (!isNewMessage) return;
        const mine = last!.senderId === this.auth.currentUser?.id;
        this.afterRender(() => this.scrollToBottom(!mine));
      })
    );
    this.subscription.add(
      this.activeTyping$.subscribe((typing) => {
        if (typing) this.afterRender(() => this.scrollToBottom(true));
      })
    );
  }

  /** Run after the browser has painted the new DOM, so scrollHeight is correct. */
  private afterRender(fn: () => void): void {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.revokePendingImage();
  }

  isMine(message: Message): boolean {
    return message.senderId === this.auth.currentUser?.id;
  }

  back(): void {
    this.store.closeChat();
  }

  onInputChange(): void {
    this.store.notifyTyping();
    this.autoGrow();
  }

  onEnter(event: Event): void {
    const keyboard = event as KeyboardEvent;
    // Don't send mid-IME-composition (e.g. selecting a CJK candidate with Enter).
    if (keyboard.isComposing || keyboard.keyCode === 229) return;
    if (keyboard.shiftKey) return;
    keyboard.preventDefault();
    void this.send();
  }

  /** Keyboard-accessible trigger for the hidden file input. */
  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  async send(): Promise<void> {
    if (this.pendingImage) {
      const file = this.pendingImage.file;
      this.clearPendingImage();
      await this.store.sendImage(file);
    }
    const text = this.messageText.trim();
    if (text) {
      this.messageText = '';
      this.autoGrow();
      await this.store.sendText(text);
    }
    this.inputRef?.nativeElement.focus();
  }

  addEmoji(emoji: string): void {
    const input = this.inputRef?.nativeElement;
    if (input) {
      const start = input.selectionStart ?? this.messageText.length;
      const end = input.selectionEnd ?? this.messageText.length;
      this.messageText = this.messageText.slice(0, start) + emoji + this.messageText.slice(end);
      queueMicrotask(() => {
        input.focus();
        const cursor = start + emoji.length;
        input.setSelectionRange(cursor, cursor);
      });
    } else {
      this.messageText += emoji;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.revokePendingImage();
    this.pendingImage = { file, previewUrl: URL.createObjectURL(file) };
  }

  clearPendingImage(): void {
    this.revokePendingImage();
    this.pendingImage = null;
  }

  retry(message: Message): void {
    this.store.retryMessage(message);
  }

  trackFeed(_: number, item: FeedItem): string {
    return item.kind === 'message' ? item.message!.id : `sep-${item.label}`;
  }

  private autoGrow(): void {
    const input = this.inputRef?.nativeElement;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }

  private scrollToBottom(onlyIfNearBottom = false): void {
    const el = this.feedRef?.nativeElement;
    if (!el) return;
    if (onlyIfNearBottom) {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distance > 160) return;
    }
    // Explicit 'auto' (instant); the CSS no longer sets scroll-behavior: smooth,
    // which used to animate history loads and defeat the near-bottom check.
    el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  }

  private revokePendingImage(): void {
    if (this.pendingImage) URL.revokeObjectURL(this.pendingImage.previewUrl);
  }
}

function buildFeed(messages: Message[]): FeedItem[] {
  const items: FeedItem[] = [];
  let previous: Message | null = null;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const next = messages[i + 1] ?? null;

    if (!previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)) {
      items.push({ kind: 'separator', label: dayLabel(message.createdAt) });
    }

    const firstOfGroup =
      !previous ||
      previous.senderId !== message.senderId ||
      dayKey(previous.createdAt) !== dayKey(message.createdAt);
    const lastOfGroup =
      !next ||
      next.senderId !== message.senderId ||
      dayKey(next.createdAt) !== dayKey(message.createdAt);

    items.push({ kind: 'message', message, firstOfGroup, lastOfGroup });
    previous = message;
  }
  return items;
}

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}
