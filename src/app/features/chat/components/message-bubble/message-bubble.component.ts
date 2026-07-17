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

  onBubbleClick(): void {
    if (this.message.status === 'failed') {
      this.retryClick.emit(this.message);
    } else if (this.message.type === 'image') {
      this.imageClick.emit(this.message.content);
    }
  }
}
