import { ApplicationConfig, importProvidersFrom, InjectionToken } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './core/auth/auth.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
 providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    }
  ]
};

export const BASE_LOGIN_URL = new InjectionToken<string>('BASE_LOGIN_URL', {
  providedIn: 'root',
  factory: () => environment.apiLoginUrl,
});

export const BASE_URL = new InjectionToken<string>('BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiConversationsUrl,
});

export const BASE_SENDMESSAGE_URL = new InjectionToken<string>('BASE_SENDMESSAGE_URL', {
  providedIn: 'root',
  factory: () => environment.apiProxyUrl,
});
