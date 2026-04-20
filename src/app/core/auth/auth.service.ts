import { Injectable, signal, computed, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthResponse, User } from '../../model/authResponse';
import { BASE_LOGIN_URL } from '../../app.config';

type LoginResponse = { accessToken: string };

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly _token = signal<string | null>(localStorage.getItem('access_token'));

  readonly token = computed(() => this._token());
  readonly isAuthenticated = computed(() => !!this._token());

  constructor(private http: HttpClient,
    @Inject(BASE_LOGIN_URL) private baseUrl: string) { }

  login(username: string, password: string): Observable<AuthResponse> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);

    return this.http.post<AuthResponse>(
      `${this.baseUrl}auth/login`,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    ).pipe(
      tap(response => {
        sessionStorage.setItem('access_token', response.access_token);
        this._token.set(response.access_token);
        sessionStorage.setItem('user', JSON.stringify(response.user));
      })
    );

  }

  logout() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
  }

  

  getToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  getUser(): User | null {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
