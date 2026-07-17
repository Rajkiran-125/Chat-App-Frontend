import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from 'src/app/core/models/chat.models';

@Component({
    selector: 'app-message-bubble',
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './message-bubble.component.html',
    styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  @Input() mine = false;
  @Input() firstOfGroup = true;
  @Input() lastOfGroup = true;

  @Output() imageClick = new EventEmitter<string>();
  @Output() retryClick = new EventEmitter<Message>();

  /** The bubble is interactive only when it can retry (failed) or open an image. */
  get interactive(): boolean {
    return this.message.status === 'failed' || this.message.type === 'image';
  }

  get ariaLabel(): string | null {
    if (this.message.status === 'failed') return 'Message failed to send. Activate to retry.';
    if (this.message.type === 'image') return 'Open photo';
    return null;
  }

  onBubbleClick(): void {
    if (this.message.status === 'failed') {
      this.retryClick.emit(this.message);
    } else if (this.message.type === 'image') {
      this.imageClick.emit(this.message.content);
    }
  }

  onKey(event: Event): void {
    if (!this.interactive) return;
    event.preventDefault();
    this.onBubbleClick();
  }
}
