import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { onboardingGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding.page').then(
        (m) => m.OnboardingPage
      ),
  },
  {
    path: 'tabs',
    canActivate: [authGuard, onboardingGuard],
    loadChildren: () =>
      import('./features/tabs/tabs.routes').then((m) => m.TABS_ROUTES),
  },
  {
    path: 'trophy/scan',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/trophy/scan/trophy-scan.page').then(
        (m) => m.TrophyScanPage
      ),
  },
  {
    path: 'trophy/review',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/trophy/review/trophy-review.page').then(
        (m) => m.TrophyReviewPage
      ),
  },
  {
    path: 'trophy/:id',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/trophy/detail/trophy-detail.page').then(
        (m) => m.TrophyDetailPage
      ),
  },
  {
    path: 'profile/edit',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/profile-edit/profile-edit.page').then(
        (m) => m.ProfileEditPage
      ),
  },
  {
    path: 'tokens',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/tokens/get-tokens.page').then(
        (m) => m.GetTokensPage
      ),
  },
  {
    path: 'pro',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/pro/pro-upgrade.page').then(
        (m) => m.ProUpgradePage
      ),
  },
  {
    path: 'race/:raceId/finishers',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/race/finishers/race-finishers.page').then(
        (m) => m.RaceFinishersPage
      ),
  },
  {
    path: 'room/edit',
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import('./features/room/edit/room-edit.page').then(
        (m) => m.RoomEditPage
      ),
  },
  {
    path: 'room/share/:slug',
    loadComponent: () =>
      import('./features/room/share/room-share.page').then(
        (m) => m.RoomSharePage
      ),
  },
  {
    path: 'room/:userId',
    loadComponent: () =>
      import('./features/room/view/room-view.page').then(
        (m) => m.RoomViewPage
      ),
  },
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
];
