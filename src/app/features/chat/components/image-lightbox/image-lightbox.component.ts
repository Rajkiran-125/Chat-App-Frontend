import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lightbox" (click)="closed.emit()" role="dialog" aria-label="Image preview">
      <button class="lightbox__close" type="button" aria-label="Close preview">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <img [src]="src" alt="Full size photo" (click)="$event.stopPropagation()" />
    </div>
  `,
  styles: [
    `
      .lightbox {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(8, 10, 16, 0.85);
        backdrop-filter: blur(4px);
        animation: fade-in 0.2s ease;
        cursor: zoom-out;
      }
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      img {
        max-width: 92vw;
        max-height: 90vh;
        border-radius: 12px;
        box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6);
        cursor: default;
        animation: zoom-in 0.22s cubic-bezier(0.21, 1.02, 0.73, 1);
      }
      @keyframes zoom-in {
        from {
          transform: scale(0.92);
        }
        to {
          transform: scale(1);
        }
      }
      .lightbox__close {
        position: absolute;
        top: 18px;
        right: 18px;
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        transition: background 0.15s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.22);
        }
        svg {
          width: 20px;
          height: 20px;
        }
      }
    `
  ]
})
export class ImageLightboxComponent {
  @Input({ required: true }) src!: string;
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
