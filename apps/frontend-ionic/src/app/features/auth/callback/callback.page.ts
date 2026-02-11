import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [IonContent, IonSpinner],
  template: `
    <ion-content>
      <div class="centered">
        <ion-spinner name="crescent" />
      </div>
    </ion-content>
  `,
  styles: `
    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  `,
})
export class AuthCallbackPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    // Refresh session to pick up the cookie set during OAuth flow
    await this.authService.refreshSession();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { replaceUrl: true });
    } else if (this.authService.hasCompletedOnboarding()) {
      this.router.navigate(['/tabs'], { replaceUrl: true });
    } else {
      this.router.navigate(['/onboarding'], { replaceUrl: true });
    }
  }
}
