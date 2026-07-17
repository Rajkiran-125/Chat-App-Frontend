import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform, inject } from '@angular/core';

/**
 * Shared 30s ticker: one interval for the whole app that marks every view
 * currently displaying a relative timestamp for check, so "5m ago" advances
 * to "6m ago" even under OnPush without a new data emission.
 */
const subscribers = new Set<ChangeDetectorRef>();
let ticker: ReturnType<typeof setInterval> | null = null;

function subscribe(cdr: ChangeDetectorRef): void {
  subscribers.add(cdr);
  if (!ticker) {
    ticker = setInterval(() => subscribers.forEach((c) => c.markForCheck()), 30_000);
  }
}

function unsubscribe(cdr: ChangeDetectorRef): void {
  subscribers.delete(cdr);
  if (subscribers.size === 0 && ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

/** "just now", "5m ago", "2h ago", "yesterday", "12 Mar" — auto-advances over time. */
@Pipe({ name: 'timeAgo', standalone: true, pure: false })
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private registered = false;

  transform(value: string | Date | null | undefined): string {
    if (!this.registered) {
      subscribe(this.cdr);
      this.registered = true;
    }
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  ngOnDestroy(): void {
    if (this.registered) unsubscribe(this.cdr);
  }
}
