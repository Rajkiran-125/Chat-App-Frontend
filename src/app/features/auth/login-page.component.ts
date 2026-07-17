import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { AVATAR_PRESETS } from 'src/app/core/utils/avatars';

const PHONE_PATTERN = /^\+?[\d\s-]{4,15}$/;

@Component({
    selector: 'app-login-page',
    imports: [CommonModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  theme = inject(ThemeService);

  readonly avatars = AVATAR_PRESETS;

  tab: 'login' | 'register' = 'login';
  readonly submitting$ = new BehaviorSubject<boolean>(false);

  loginForm = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]]
  });

  registerForm = this.fb.nonNullable.group({
    userName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    avatar: [this.avatars[0], Validators.required]
  });

  switchTab(tab: 'login' | 'register'): void {
    this.tab = tab;
  }

  selectAvatar(avatar: string): void {
    this.registerForm.controls.avatar.setValue(avatar);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.submitting$.next(true);
    this.auth.login(this.loginForm.getRawValue().phone).subscribe({
      next: ({ user }) => {
        this.toast.success(`Welcome back, ${user.userName}!`);
        void this.router.navigateByUrl('/chat');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting$.next(false);
        this.toast.error(errorText(err, 'Login failed. Please try again.'));
      }
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { userName, phone, avatar } = this.registerForm.getRawValue();
    this.submitting$.next(true);
    this.auth.register(userName, phone, avatar).subscribe({
      next: ({ user }) => {
        this.toast.success(`Account created. Welcome, ${user.userName}!`);
        void this.router.navigateByUrl('/chat');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting$.next(false);
        this.toast.error(errorText(err, 'Registration failed. Please try again.'));
      }
    });
  }
}

function errorText(err: HttpErrorResponse, fallback: string): string {
  if (err.status === 0) return 'Cannot reach the server. Is it running?';
  return err.error?.message || fallback;
}
