import { ApplicationConfig, importProvidersFrom, InjectionToken } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './core/auth/auth.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
 providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClient),
    importProvidersFrom(HttpClientModule),
    { 
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true, // 🔥 importantissimo
    }
  ]
};

export const BASE_LOGIN_URL = new InjectionToken<string>('BASE_LOGIN_URL', {
  providedIn: 'root',
  factory: () => 'https://xs6p4xtv3h.execute-api.eu-central-1.amazonaws.com/v1/' 
})


export const BASE_URL = new InjectionToken<string>('BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://umaeflqqg5.execute-api.eu-central-1.amazonaws.com/v1/' 
})

export const BASE_SENDMESSAGE_URL = new InjectionToken<string>('BASE_SENDMESSAGE_URL', {
  providedIn: 'root',
  factory: () => 'https://xs6p4xtv3h.execute-api.eu-central-1.amazonaws.com/v1/' 
});

