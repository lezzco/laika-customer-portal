import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

type LoginResponse = { accessToken: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(localStorage.getItem('access_token'));

  readonly token = computed(() => this._token());
  readonly isAuthenticated = computed(() => !!this._token());

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        this._token.set(res.accessToken);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    this._token.set(null);
  }
}
