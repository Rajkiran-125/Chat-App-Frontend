import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  AuthResponse,
  MessagesPage,
  SidebarUser,
  User
} from '../models/chat.models';

/** Typed wrapper around the chat REST API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api`;

  register(userName: string, phone: string, avatar: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, { userName, phone, avatar });
  }

  login(phone: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { phone });
  }

  me(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.base}/auth/me`);
  }

  users(): Observable<{ users: SidebarUser[] }> {
    return this.http.get<{ users: SidebarUser[] }>(`${this.base}/users`);
  }

  openRoom(userId: string): Observable<{ room: { id: string; memberIds: string[] } }> {
    return this.http.post<{ room: { id: string; memberIds: string[] } }>(`${this.base}/rooms`, { userId });
  }

  history(roomId: string, before?: string, limit = 50): Observable<MessagesPage> {
    const params: Record<string, string> = { limit: String(limit) };
    if (before) params['before'] = before;
    return this.http.get<MessagesPage>(`${this.base}/rooms/${roomId}/messages`, { params });
  }
}
