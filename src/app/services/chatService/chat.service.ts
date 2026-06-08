import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BASE_SENDMESSAGE_URL, BASE_URL } from '../../app.config';
import { Chat } from '../../model/models';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthTokenService } from '../../core/auth/auth.service';
import { HumanResponseRequest, SendMessageRequest, UpdateReadStatusRequest } from '../../model/requestModel';
import { ResponseMessage, SendMessageResponse } from '../../model/responseModel';


@Injectable({ providedIn: 'root' })
export class ChatService {


  constructor(private http: HttpClient,
    @Inject(BASE_URL) private baseUrl: string,
  @Inject(BASE_SENDMESSAGE_URL) private sendMessageUrl: string ) { }


    getChatsFromCustomer(customerId: string) {
      //customerId= "customer_marco";
return this. http.get<{ items: Chat[]; next_cursor: string | null }>(
    `${this.baseUrl}conversations/active/company/${customerId}`
  ).pipe(
    map(response => response.items ?? []),
    catchError(err => {
      console.error('Chat service error:', err);
      return of([]);
    })
  );    }


  sendMessages(messageRequest:SendMessageRequest):Observable<SendMessageResponse>{
    return this.http.post<SendMessageResponse>(this.sendMessageUrl+'chat/sendMessage/',messageRequest);
  }

  sendHumanResponse(request: HumanResponseRequest): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.sendMessageUrl}chat/sendHumanResponse/`,
      request
    );
  }

  /**
   * POST /messages/read-status (Conversations API, BASE_URL).
   * messagesRouter è montato con prefix "/messages" → path completo /messages/read-status.
   * Array vuoto per chat_id = segna tutti i messaggi della chat come letti.
   */
  updateReadStatus(updates: Record<string, string[]>): Observable<void> {
    const body: UpdateReadStatusRequest = { updates };
    return this.http.post<void>(`${this.baseUrl}messages/read-status`, body);
  }

  markChatAsRead(chatId: string): Observable<void> {
    return this.updateReadStatus({ [chatId]: [] });
  }

  getActiveChatSorted(){
    return this.http.get<{ active_chats: Chat[];inactive_chats: Chat[];next_cursor: string | null }>(
    `${this.baseUrl}chats/first-batch-chat`
  ).pipe(
    map(response => [...(response.active_chats ?? []), ...(response.inactive_chats ?? [])]),
    catchError(err => {
      console.error('Chat service error:', err);
      return of([]);
    })
  );
  }

  getChatById(chat_id: string): Observable<Chat> {
  return this.http.get<Chat>(`${this.baseUrl}chats/${chat_id}`);
  }
}