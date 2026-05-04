import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthTokenService } from '../../core/auth/auth.service';
import { ChatSocketEvent } from '../../model/websocketModel';

@Injectable({
  providedIn: 'root'
})
@Injectable({ providedIn: 'root' })
export class WeksocketService {


  private readonly zone = inject(NgZone);
  private readonly auth = inject(AuthTokenService);

  private socket: WebSocket | null = null;
  private readonly eventsSubject = new Subject<ChatSocketEvent>();

  readonly events$: Observable<ChatSocketEvent> = this.eventsSubject.asObservable();

  connect() {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;

    const token = this.auth.token();
    // const url = this.buildSocketUrl(token);
    const url = "wss://cds36ylgwc.execute-api.eu-central-1.amazonaws.com/test/";

    this.socket = new WebSocket(url);
    

    this.socket.onopen = () => {
      if (this.socket) {
        this.socket.send(JSON.stringify({ type: 'token', token }));
    
  }

    console.log("✅ WebSocket connesso");
  };
    this.socket.onmessage = event => {
      this.zone.run(() => {
        const parsed = this.parseEvent(event.data);
        if (parsed) this.eventsSubject.next(parsed);
      });
    };

    this.socket.onclose = () => {
       console.log("❌ WebSocket disconnesso ");
      this.socket = null;
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }

  private buildSocketUrl(token: string | null) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = new URL(`${protocol}//${window.location.host}/ws/chat`);

    if (token) {
      url.searchParams.set('token', token);
    }

    return url.toString();
  }

  private parseEvent(raw: unknown): ChatSocketEvent | null {
    if (typeof raw !== 'string') return null;

    try {
      console.log("📩 Messaggio ricevuto:", raw);
      return JSON.parse(raw) as ChatSocketEvent;
    } catch {
      return null;
    }
  }
}
