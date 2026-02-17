import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TrophyService } from '../services/trophy.service';

export const firstTrophyGuard: CanActivateFn = async () => {
  // Fast-path: localStorage flag already set
  const flag = localStorage.getItem('firstTrophyCompleted');
  if (flag === 'true' || flag === 'dismissed') {
    return true;
  }

  const trophyService = inject(TrophyService);
  const router = inject(Router);

  await trophyService.fetchTrophies();

  const hasReadyTrophy = trophyService.trophies().some((t) => t.status === 'ready');
  if (hasReadyTrophy) {
    localStorage.setItem('firstTrophyCompleted', 'true');
    return true;
  }

  return router.createUrlTree(['/trophy/first']);
};
