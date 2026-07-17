import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />
  `
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  // Instantiated eagerly so the theme applies before the first paint.
  private theme = inject(ThemeService);

  ngOnInit(): void {
    this.auth.refreshSession();
  }
}
