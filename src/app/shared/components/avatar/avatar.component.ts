import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Circular avatar with an optional presence dot and initials fallback. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar" [style.width.px]="size" [style.height.px]="size">
      <img
        *ngIf="src && !failed; else initials"
        [src]="src"
        [alt]="name"
        (error)="failed = true"
        loading="lazy"
      />
      <ng-template #initials>
        <span class="avatar__initials" [style.fontSize.px]="size * 0.38">{{ initialsOf(name) }}</span>
      </ng-template>
      <span
        *ngIf="showPresence"
        class="avatar__dot"
        [class.avatar__dot--online]="online"
        [style.width.px]="size * 0.28"
        [style.height.px]="size * 0.28"
      ></span>
    </span>
  `,
  styles: [
    `
      .avatar {
        position: relative;
        display: inline-flex;
        flex-shrink: 0;
        border-radius: 50%;
      }
      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }
      .avatar__initials {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        color: #fff;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .avatar__dot {
        position: absolute;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        background: var(--text-tertiary);
        border: 2px solid var(--surface);
        transition: background 0.2s ease;
      }
      .avatar__dot--online {
        background: var(--online);
      }
    `
  ]
})
export class AvatarComponent {
  @Input() src: string | null = null;
  @Input() name = '';
  @Input() size = 44;
  @Input() online = false;
  @Input() showPresence = false;

  failed = false;

  initialsOf(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('');
  }
}
