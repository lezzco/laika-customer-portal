import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    // canActivate: [authGuard],
    loadComponent: () => import('./pages/cockpit/cockpit.component').then(m => m.CockpitComponent),
  },
  {
    path:'charts',
    // canActivate: [authGuard],
    loadComponent: () => import('./pages/chart-kpi/chart-kpi.component').then(m => m.ChartKpiComponent),
  },
  { path: '**', redirectTo: '' },
];
