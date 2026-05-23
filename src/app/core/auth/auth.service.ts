import { Injectable, signal, computed, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthResponse, User } from '../../model/authResponse';
import { BASE_LOGIN_URL } from '../../app.config';

const TOKEN_STORAGE_KEY = 'access_token';
const USER_STORAGE_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<User | null>(null);
  readonly token = computed(() => this._token());
  readonly isAuthenticated = computed(() => this.hasValidToken(this._token()));

  constructor(
    private http: HttpClient,
    @Inject(BASE_LOGIN_URL) private baseUrl: string
  ) {
    this.restoreSession();
  }
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
        const user = this.userWithCompanyFromToken(response.user, response.access_token);
        this._token.set(response.access_token);
        this._user.set(user);
        this.persistSession(response.access_token, user);
      })
    );

  }

  logout() {
    this.clearSession();
  }

  private persistSession(token: string, user: User): void {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private restoreSession(): void {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token || !this.hasValidToken(token)) {
      this.clearSession();
      return;
    }

    const user = this.parseStoredUser(sessionStorage.getItem(USER_STORAGE_KEY));
    this._token.set(token);
    this._user.set(user ? this.userWithCompanyFromToken(user, token) : null);
  }

  private parseStoredUser(raw: string | null): User | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    this._token.set(null);
    this._user.set(null);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }

  private hasValidToken(token: string | null): boolean {
    return !!token && !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload(token);
    if (!payload) return true;

    const exp = payload['exp'];
    if (typeof exp !== 'number') return false;

    return Date.now() >= exp * 1000;
  }

  private userWithCompanyFromToken(user: User, token: string): User {
    const companyId = this.getCompanyIdFromToken(token);
    return {
      ...user,
      company_id: companyId ?? user.company_id ?? '',
    };
  }

  private getCompanyIdFromToken(token: string): string | null {
    const payload = this.decodeJwtPayload(token);
    if (!payload) return null;

    const companyId = payload['company_id'] ?? payload['companyId'];
    if (companyId == null) return null;
    return String(companyId);
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(char => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );

      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this._token();
  }

  getUser(): User | null {
    return this._user();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }
}
