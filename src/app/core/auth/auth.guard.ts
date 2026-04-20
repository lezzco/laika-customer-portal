import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthTokenService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthTokenService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  router.navigateByUrl('/login');
  return false;
};
