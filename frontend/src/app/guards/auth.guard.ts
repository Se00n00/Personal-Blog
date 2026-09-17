import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Blocks /create and /edit/:id for visitors — sends them to /login first. */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.loggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: '/' + route.url.map((s) => s.path).join('/') }
  });
};
