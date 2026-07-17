import { Injectable, NgZone } from '@angular/core';
import { Observable, share } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

/**
 * Thin Socket.IO wrapper. One socket per session; streams are created with
 * proper teardown (listener removal - never a socket disconnect) and shared,
 * so multiple subscribers can never register duplicate listeners.
 */
@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private streams = new Map<string, Observable<unknown>>();

  constructor(private zone: NgZone) {}

  get connected(): boolean {
    return !!this.socket?.connected;
  }

  connect(token: string): void {
    if (this.socket) this.disconnect();
    this.socket = io(environment.apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.streams.clear();
  }

  /** Shared, zone-aware stream of a server event. */
  on<T>(event: string): Observable<T> {
    let stream = this.streams.get(event);
    if (!stream) {
      stream = new Observable<unknown>((observer) => {
        const handler = (data: unknown) => this.zone.run(() => observer.next(data));
        this.socket?.on(event, handler);
        return () => this.socket?.off(event, handler);
      }).pipe(share());
      this.streams.set(event, stream);
    }
    return stream as Observable<T>;
  }

  emit(event: string, payload: unknown): void {
    this.socket?.emit(event, payload);
  }

  /** Emit and resolve with the server's ack (rejects on timeout). */
  emitWithAck<T>(event: string, payload: unknown, timeoutMs = 10000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not connected'));
      this.socket
        .timeout(timeoutMs)
        .emit(event, payload, (err: Error | null, response: T) => {
          this.zone.run(() => (err ? reject(err) : resolve(response)));
        });
    });
  }
}
