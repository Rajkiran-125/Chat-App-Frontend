import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarUser } from 'src/app/core/models/chat.models';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { TimeAgoPipe } from 'src/app/shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-profile-drawer',
  standalone: true,
  imports: [CommonModule, AvatarComponent, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <aside class="drawer" role="dialog" aria-label="Contact info">
      <header class="drawer__header">
        <h3>Contact info</h3>
        <button class="icon-btn" type="button" (click)="closed.emit()" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div class="drawer__body">
        <app-avatar [src]="user.avatar" [name]="user.userName" [size]="120" [online]="user.online"
          [showPresence]="true" />
        <h2>{{ user.userName }}</h2>
        <p class="drawer__presence" [class.online]="user.online">
          {{ user.online ? 'online' : user.lastSeenAt ? 'last seen ' + (user.lastSeenAt | timeAgo) : 'offline' }}
        </p>

        <div class="drawer__card">
          <small>Phone</small>
          <span>{{ user.phone }}</span>
        </div>
        <div class="drawer__card" *ngIf="user.createdAt">
          <small>Member since</small>
          <span>{{ user.createdAt | date: 'mediumDate' }}</span>
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(10, 12, 20, 0.4);
        z-index: 10;
        animation: fade-in 0.2s ease;
      }
      .drawer {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(360px, 92vw);
        background: var(--surface);
        border-left: 1px solid var(--border);
        z-index: 11;
        display: flex;
        flex-direction: column;
        animation: slide-in 0.25s cubic-bezier(0.21, 1.02, 0.73, 1);
      }
      @keyframes slide-in {
        from {
          transform: translateX(40px);
          opacity: 0;
        }
        to {
          transform: none;
          opacity: 1;
        }
      }
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .drawer__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid var(--border);

        h3 {
          font-size: 16px;
        }
      }
      .drawer__body {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px 22px;

        h2 {
          margin-top: 16px;
          font-size: 20px;
          text-align: center;
        }
      }
      .drawer__presence {
        margin: 4px 0 22px;
        font-size: 13.5px;
        color: var(--text-tertiary);

        &.online {
          color: var(--online);
          font-weight: 500;
        }
      }
      .drawer__card {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 13px 16px;
        margin-bottom: 10px;
        background: var(--surface-2);
        border-radius: var(--radius-md);

        small {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: var(--text-tertiary);
        }
        span {
          font-size: 14.5px;
        }
      }
    `
  ]
})
export class ProfileDrawerComponent {
  @Input({ required: true }) user!: SidebarUser;
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
