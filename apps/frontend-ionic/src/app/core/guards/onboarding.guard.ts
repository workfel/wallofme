import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const onboardingGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for session to be loaded before checking onboarding status
  if (authService.isPending()) {
    await waitUntilReady(authService);
  }

  if (authService.hasCompletedOnboarding()) {
    return true;
  }

  return router.createUrlTree(['/onboarding']);
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
