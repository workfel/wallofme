import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'otp',
    loadComponent: () =>
      import('./otp/otp.page').then((m) => m.OtpPage),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./callback/callback.page').then((m) => m.AuthCallbackPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
