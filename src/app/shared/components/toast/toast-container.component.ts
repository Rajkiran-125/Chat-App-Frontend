import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      <div
        *ngFor="let toast of toastService.toasts$ | async; trackBy: trackById"
        class="toast"
        [class.toast--success]="toast.type === 'success'"
        [class.toast--error]="toast.type === 'error'"
        role="status"
        (click)="toastService.dismiss(toast.id)"
      >
        <span class="toast__icon">
          {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i' }}
        </span>
        <span class="toast__text">{{ toast.text }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .toasts {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: min(360px, calc(100vw - 32px));
      }
      .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 14px;
        background: var(--surface);
        color: var(--text-primary);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-lg);
        cursor: pointer;
        animation: toast-in 0.25s cubic-bezier(0.21, 1.02, 0.73, 1);
        font-size: 14px;
      }
      .toast__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        border-radius: 50%;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        background: var(--accent);
      }
      .toast--success .toast__icon {
        background: var(--online);
      }
      .toast--error .toast__icon {
        background: var(--danger);
      }
      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `
  ]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  trackById(_: number, toast: { id: number }): number {
    return toast.id;
  }
}
