import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  NavController,
  Platform,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { camera, ribbonOutline } from 'ionicons/icons';
import { TrophyService } from '@app/core/services/trophy.service';

@Component({
  selector: 'app-first-trophy',
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonButton,
    IonIcon,
    IonText,
  ],
  template: `
    <ion-content [fullscreen]="true">
      <div class="first-trophy-container animate-fade-in-up">
        <div class="step-indicator">
          <span>{{ 'firstTrophy.step' | translate }}</span>
        </div>

        <div class="hero-section">
          <div class="hero-icon-wrapper">
            <ion-icon name="ribbon-outline" class="hero-icon" />
          </div>
          <h1>{{ 'firstTrophy.title' | translate }}</h1>
          <ion-text color="medium">
            <p class="subtitle">{{ 'firstTrophy.subtitle' | translate }}</p>
          </ion-text>
        </div>

        <div class="actions-section">
          <ion-button expand="block" (click)="goToScan()">
            <ion-icon slot="start" name="camera" />
            {{ 'firstTrophy.scanNow' | translate }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .first-trophy-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
      padding: 40px 24px;
      max-width: 400px;
      margin: 0 auto;
    }

    .step-indicator {
      text-align: center;
      margin-bottom: 24px;

      span {
        font-size: 13px;
        font-weight: 600;
        color: var(--ion-color-primary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
    }

    .hero-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 16px;
    }

    .hero-icon-wrapper {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(
        135deg,
        var(--ion-color-primary) 0%,
        var(--ion-color-secondary, var(--ion-color-primary-shade)) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }

    .hero-icon {
      font-size: 56px;
      color: #fff;
    }

    h1 {
      font-size: 28px;
      font-weight: 800;
      margin: 0;
      line-height: 1.2;
    }

    .subtitle {
      font-size: 16px;
      line-height: 1.5;
      margin: 0;
      max-width: 300px;
    }

    .actions-section {
      padding-top: 40px;

      ion-button {
        margin-bottom: 8px;
      }
    }
  `,
})
export class FirstTrophyPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private alertController = inject(AlertController);
  private platform = inject(Platform);
  private translate = inject(TranslateService);
  private trophyService = inject(TrophyService);

  private backButtonSub?: ReturnType<typeof this.platform.backButton.subscribeWithPriority>;

  constructor() {
    addIcons({ camera, ribbonOutline });
  }

  async ngOnInit(): Promise<void> {
    // Register hardware back button override
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
      this.confirmBack();
    });

    // Reinstall case: if the user already has ready trophies in the DB, skip the gate
    await this.trophyService.fetchTrophies();
    const hasReadyTrophy = this.trophyService.trophies().some((t) => t.status === 'ready');
    if (hasReadyTrophy) {
      localStorage.setItem('firstTrophyCompleted', 'true');
      this.navCtrl.navigateRoot('/tabs/home', { animated: false });
    }
  }

  ngOnDestroy(): void {
    this.backButtonSub?.unsubscribe();
  }

  goToScan(): void {
    this.router.navigate(['/trophy/create']);
  }

  async confirmBack(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translate.instant('firstTrophy.backConfirmTitle'),
      message: this.translate.instant('firstTrophy.backConfirmMessage'),
      buttons: [
        {
          text: this.translate.instant('firstTrophy.backConfirmContinue'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('firstTrophy.backConfirmSkip'),
          role: 'destructive',
          handler: () => {
            localStorage.setItem('firstTrophyCompleted', 'dismissed');
            this.navCtrl.navigateRoot('/tabs/home', { animated: true, animationDirection: 'back' });
          },
        },
      ],
    });
    await alert.present();
  }
}
