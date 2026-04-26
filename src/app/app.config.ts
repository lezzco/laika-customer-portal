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

export const BASE_LOGIN_URL = new InjectionToken<string>('BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://0d7rdlj5w1.execute-api.eu-central-1.amazonaws.com/v1/' 
})


export const BASE_URL = new InjectionToken<string>('BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://h5sczn5j03.execute-api.eu-central-1.amazonaws.com/' 
})


