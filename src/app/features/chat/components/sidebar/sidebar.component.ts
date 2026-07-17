import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { ChatStoreService } from 'src/app/core/services/chat-store.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { SidebarUser } from 'src/app/core/models/chat.models';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { TimeAgoPipe } from 'src/app/shared/pipes/time-ago.pipe';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, FormsModule, AvatarComponent, TimeAgoPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  store = inject(ChatStoreService);
  auth = inject(AuthService);
  theme = inject(ThemeService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly search$ = new BehaviorSubject<string>('');

  /** Sidebar list filtered by the search box (name or phone). */
  readonly filteredUsers$ = combineLatest([this.store.users$, this.search$]).pipe(
    map(([users, term]) => {
      const query = term.trim().toLowerCase();
      if (!query) return users;
      return users.filter(
        (u) => u.userName.toLowerCase().includes(query) || u.phone.includes(query)
      );
    })
  );

  readonly skeletons = Array.from({ length: 7 });

  onSearch(value: string): void {
    this.search$.next(value);
  }

  open(user: SidebarUser): void {
    void this.store.openChat(user);
  }

  previewFor(user: SidebarUser): string {
    const last = user.lastMessage;
    if (!last) return 'Say hi 👋';
    const prefix = last.senderId === this.auth.currentUser?.id ? 'You: ' : '';
    return prefix + (last.type === 'image' ? '📷 Photo' : last.content);
  }

  isTyping(user: SidebarUser, typing: ReadonlySet<string> | null): boolean {
    return !!user.roomId && !!typing?.has(user.roomId);
  }

  logout(): void {
    this.store.teardown();
    this.auth.clearSession();
    this.toast.info('You have been signed out.');
    void this.router.navigateByUrl('/login');
  }

  trackById(_: number, user: SidebarUser): string {
    return user.id;
  }
}
