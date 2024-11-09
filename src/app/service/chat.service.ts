import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket,io } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class ChatService {
  
  private socket: Socket;
  // private url = 'http://localhost:3000'; // your server local path
  private url = 'https://chat-app-node-socket-io-5m2o.onrender.com'; // your server local path

  constructor(
    private http: HttpClient
  ) {
    this.socket = io(this.url, {transports: ['websocket', 'polling', 'flashsocket']});
  }

  ngOnInit(): void {
    this.wakeUpApi();
  }

  wakeUpApi(){
    const res = this.http.get(this.url);
    console.log(res);
  }

  joinRoom(data): void {
    this.socket.emit('join', data);
  }

  sendMessage(data): void {
    this.socket.emit('message', data);
  }

  getMessage(): Observable<any> {
    return new Observable<{user: string, message: string}>(observer => {
      this.socket.on('new message', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.disconnect();
      }
    });
  }

  getStorage() {
    const storage: string = localStorage.getItem('chats');
    return storage ? JSON.parse(storage) : [];
  }

  setStorage(data) {
    localStorage.setItem('chats', JSON.stringify(data));
  }

}
