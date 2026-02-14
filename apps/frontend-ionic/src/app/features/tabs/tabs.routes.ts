import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { authGuard } from '@app/core/guards/auth.guard';
import { onboardingGuard } from '@app/core/guards/onboarding.guard';

export const TABS_ROUTES: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        canActivate: [authGuard, onboardingGuard],
        loadComponent: () =>
          import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'explore',
        loadComponent: () =>
          import('./explore/explore.page').then((m) => m.ExplorePage),
      },
{
        path: 'profile',
        canActivate: [authGuard, onboardingGuard],
        loadComponent: () =>
          import('./profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
