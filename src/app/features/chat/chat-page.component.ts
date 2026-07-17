import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStoreService } from 'src/app/core/services/chat-store.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ConversationComponent } from './components/conversation/conversation.component';
import { ProfileDrawerComponent } from './components/profile-drawer/profile-drawer.component';
import { ImageLightboxComponent } from './components/image-lightbox/image-lightbox.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    ConversationComponent,
    ProfileDrawerComponent,
    ImageLightboxComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell" [class.shell--chat-open]="!!(store.activeChat$ | async)">
      <app-sidebar class="shell__sidebar" />
      <app-conversation
        class="shell__main"
        (profileClick)="profileOpen = true"
        (imageClick)="lightboxSrc = $event"
      />
      <app-profile-drawer
        *ngIf="profileOpen && (store.activeChat$ | async) as user"
        [user]="user"
        (closed)="profileOpen = false"
      />
      <app-image-lightbox *ngIf="lightboxSrc" [src]="lightboxSrc" (closed)="lightboxSrc = null" />
    </div>
  `,
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {
  store = inject(ChatStoreService);

  profileOpen = false;
  lightboxSrc: string | null = null;

  ngOnInit(): void {
    this.store.init();
  }
}
