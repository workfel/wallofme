import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import { home, compass, person, add } from "ionicons/icons";

import { UserService } from "@app/core/services/user.service";

@Component({
  selector: "app-tabs",
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    TranslateModule,
  ],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
          <ion-icon name="home" />
          <ion-label>{{ "tabs.home" | translate }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="explore">
          <ion-icon name="compass" />
          <ion-label>{{ "tabs.explore" | translate }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile">
          <ion-icon name="person" />
          <ion-label>{{ "tabs.profile" | translate }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>

    <div class="fab-scan" (click)="onFabTap()">
      <ion-icon name="add" />
    </div>
  `,
  styles: `
    .fab-scan {
      position: fixed;
      bottom: calc(env(safe-area-inset-bottom, 0px) + 62px);
      right: 16px;
      z-index: 100;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(var(--ion-color-primary-rgb), 0.4);
      cursor: pointer;
      transition: transform 0.15s ease;

      &:active {
        transform: scale(0.92);
      }

      ion-icon {
        font-size: 28px;
      }
    }
  `,
})
export class TabsPage {
  private router = inject(Router);
  private userService = inject(UserService);

  constructor() {
    addIcons({ home, compass, person, add });
  }

  onFabTap(): void {
    const remaining = this.userService.scansRemaining();
    if (remaining !== null && remaining <= 0 && !this.userService.isPro()) {
      this.router.navigate(['/pro']);
      return;
    }
    this.router.navigate(['/trophy/create']);
  }
}
