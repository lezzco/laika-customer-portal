import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthTokenService } from './auth.service';

/** Se già autenticato, non mostrare la pagina di login. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthTokenService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/chat']);
  }

  return true;
};
