import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, User } from '../models/chat.models';

const TOKEN_KEY = 'chatapp.token';
const USER_KEY = 'chatapp.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);

  private readonly userSubject = new BehaviorSubject<User | null>(readStoredUser());
  readonly currentUser$ = this.userSubject.asObservable();

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  login(phone: string): Observable<AuthResponse> {
    return this.api.login(phone).pipe(tap((res) => this.storeSession(res)));
  }

  register(userName: string, phone: string, avatar: string): Observable<AuthResponse> {
    return this.api.register(userName, phone, avatar).pipe(tap((res) => this.storeSession(res)));
  }

  /** Re-validate a stored token against the server (used on app start). */
  refreshSession(): void {
    if (!this.token) return;
    this.api.me().subscribe({
      next: ({ user }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.userSubject.next(user);
      },
      error: () => this.clearSession()
    });
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.userSubject.next(res.user);
  }
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
