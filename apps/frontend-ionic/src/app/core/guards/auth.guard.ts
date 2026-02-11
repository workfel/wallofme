import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for initial session check to complete
  if (authService.isPending()) {
    await waitUntilReady(authService);
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

function waitUntilReady(authService: AuthService): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (!authService.isPending()) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}
