import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BASE_LOGIN_URL, BASE_SENDMESSAGE_URL, BASE_URL } from '../../app.config';
import { Chat } from '../../model/models';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthTokenService } from '../../core/auth/auth.service';
import { SendMessageRequest } from '../../model/requestModel';
import { SendMessageResponse } from '../../model/responseModel';

@Injectable({
  providedIn: 'root'
})
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

  setMessageRead(chat_id: string) :Observable<any>  {
    return this.http.post<any>(`${this.baseUrl}/messages/read-status`, {
    updates: { [chat_id]: [] }
  });
  }

  getActiveChatSorted(){
    return this.http.get<{ active_chats: Chat[];inactive_chats: Chat[];next_cursor: string | null }>(
    `${this.baseUrl}/chats/first-batch-chat`
  ).pipe(
    map(response => [...(response.active_chats ?? []), ...(response.inactive_chats ?? [])]),
    catchError(err => {
      console.error('Chat service error:', err);
      return of([]);
    })
  );
  }

  getChatById(chat_id: string): Observable<Chat> {
  return this.http.get<Chat>(`${this.baseUrl}/chats/${chat_id}`);
  }
}