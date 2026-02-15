import { Component, inject, signal, computed } from "@angular/core";
import { Router } from "@angular/router";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  home,
  homeOutline,
  compass,
  compassOutline,
  add,
  person,
  personOutline,
} from "ionicons/icons";

import { UserService } from "@app/core/services/user.service";

@Component({
  selector: "app-tabs",
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon],
  template: `
    <ion-tabs (ionTabsDidChange)="onTabChange($event)">
      <ion-tab-bar slot="bottom">

        <ion-tab-button tab="home">
          <ion-icon
            [name]="activeTab() === 'home' ? 'home' : 'home-outline'"
          />
        </ion-tab-button>


        <ion-tab-button tab="explore">
          <ion-icon
            [name]="
              activeTab() === 'explore' ? 'compass' : 'compass-outline'
            "
          />
        </ion-tab-button>

        <ion-tab-button tab="profile">
          <!-- @if (userImage()) {
            <img
              [src]="userImage()"
              alt=""
              class="tab-avatar"
              [class.tab-avatar--active]="activeTab() === 'profile'"
            />
          } @else {
            <div
              class="tab-avatar tab-avatar--fallback"
              [class.tab-avatar--active]="activeTab() === 'profile'"
            >
              {{ initials() }}
            </div>
          } -->
          <ion-icon
            [name]="
              activeTab() === 'profile' ? 'person' : 'person-outline'
            "
          />
        </ion-tab-button>


        <div class="fab-in-bar" (click)="onFabTap()" aria-hidden>
          <ion-icon name="add" />
        </div>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: `
    .tab-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid transparent;
      transition: border-color 0.2s ease;
    }

    .tab-avatar--active {
      border-color: var(--ion-color-primary);
    }

    .tab-avatar--fallback {
      background: var(--ion-color-step-100, #e6e6e6);
      color: var(--ion-color-step-600, #666);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
    }

    .fab-in-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: center;
      width: 52px;
      height: 52px;
      min-width: 52px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast, #fff);
      margin: 0 6px;
      cursor: pointer;
      flex-shrink: 0;
      transition: transform 0.15s ease;
      box-shadow: 0 2px 12px rgba(var(--ion-color-primary-rgb), 0.3);

      &:active {
        transform: scale(0.92);
      }

      ion-icon {
        font-size: 24px;
      }
    }
  `,
})
export class TabsPage {
  private router = inject(Router);
  private userService = inject(UserService);

  private _activeTab = signal("home");
  readonly activeTab = this._activeTab.asReadonly();

  readonly userImage = computed(
    () => this.userService.profile()?.image ?? null,
  );
  readonly initials = computed(() => {
    const p = this.userService.profile();
    if (!p) return "";
    const f = p.firstName?.[0] ?? "";
    const l = p.lastName?.[0] ?? "";
    return (f + l).toUpperCase() || (p.name?.[0]?.toUpperCase() ?? "");
  });

  constructor() {
    addIcons({ home, homeOutline, compass, compassOutline, add, person, personOutline });
  }

  onTabChange(event: { tab: string }): void {
    this._activeTab.set(event.tab);
  }

  onFabTap(): void {
    const remaining = this.userService.scansRemaining();
    if (remaining !== null && remaining <= 0 && !this.userService.isPro()) {
      this.router.navigate(["/pro"]);
      return;
    }
    this.router.navigate(["/trophy/create"]);
  }
}
