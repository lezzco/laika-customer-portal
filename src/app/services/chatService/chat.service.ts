import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BASE_LOGIN_URL, BASE_URL } from '../../app.config';
import { Chat } from '../../model/models';
import { catchError, map, of } from 'rxjs';
import { AuthTokenService } from '../../core/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
@Injectable({ providedIn: 'root' })
export class ChatService {


  constructor(private http: HttpClient,
    @Inject(BASE_URL) private baseUrl: string ) { }


    getChatsFromCustomer(customerId: string) {
      //customerId= "customer_marco";
return this. http.get<{ items: Chat[]; next_cursor: string | null }>(
    `${this.baseUrl}v1/conversations/customer/${customerId}`
  ).pipe(
    map(response => response.items ?? []),
    catchError(err => {
      console.error('Chat service error:', err);
      return of([]);
    })
  );    }
  }