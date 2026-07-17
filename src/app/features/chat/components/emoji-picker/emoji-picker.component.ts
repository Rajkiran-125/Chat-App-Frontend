import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EMOJI_CATEGORIES } from 'src/app/core/utils/emoji-data';

@Component({
    selector: 'app-emoji-picker',
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="picker" role="dialog" aria-label="Emoji picker">
      <div class="picker__tabs">
        <button
          *ngFor="let category of categories; let i = index"
          type="button"
          [class.active]="i === activeIndex"
          (click)="activeIndex = i"
          [title]="category.name"
        >
          {{ category.icon }}
        </button>
      </div>
      <div class="picker__grid">
        <button
          *ngFor="let emoji of categories[activeIndex].emojis"
          type="button"
          (click)="picked.emit(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  `,
    styles: [
        `
      .picker {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 12px;
        width: 320px;
        max-width: calc(100vw - 24px);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        z-index: 20;
        animation: picker-in 0.18s ease;
      }
      @keyframes picker-in {
        from {
          opacity: 0;
          transform: translateY(6px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .picker__tabs {
        display: flex;
        border-bottom: 1px solid var(--border);
        background: var(--surface-2);

        button {
          flex: 1;
          padding: 9px 0;
          font-size: 17px;
          border-bottom: 2px solid transparent;
          filter: grayscale(1);
          transition: filter 0.15s ease;

          &.active {
            border-bottom-color: var(--accent);
            filter: none;
          }
          &:hover {
            filter: none;
          }
        }
      }
      .picker__grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 2px;
        padding: 10px;
        height: 230px;
        overflow-y: auto;

        button {
          font-size: 20px;
          padding: 4px 0;
          border-radius: 8px;
          transition: background 0.1s ease, transform 0.1s ease;

          &:hover {
            background: var(--surface-2);
            transform: scale(1.15);
          }
        }
      }
    `
    ]
})
export class EmojiPickerComponent {
  @Output() picked = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  categories = EMOJI_CATEGORIES;
  activeIndex = 0;

  private host = inject(ElementRef<HTMLElement>);

  @HostListener('document:pointerdown', ['$event'])
  onOutsideClick(event: PointerEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
