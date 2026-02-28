import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatMessage, ChatThread } from './chat.models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  constructor(private readonly http: HttpClient) {}

  getThreads(): Observable<ChatThread[]> {
    return this.http.get<ChatThread[]>('/api/chat/threads');
  }

  sendMessage(threadId: number, text: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`/api/chat/threads/${threadId}/messages`, { text });
  }

  markAsRead(threadId: number): Observable<void> {
    return this.http.post<void>(`/api/chat/threads/${threadId}/read`, {});
  }
}
