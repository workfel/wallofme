import { Component, inject, signal, computed, DestroyRef, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
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
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, TranslateModule],
  template: `
    @if (isDesktop()) {
      <nav class="desktop-sidebar">
        <div class="sidebar-nav-items">
          <a class="sidebar-nav-item" [class.active]="activeTab() === 'home'" (click)="navigateToTab('home')">
            <ion-icon [name]="activeTab() === 'home' ? 'home' : 'home-outline'" />
            <span>{{ 'tabs.home' | translate }}</span>
          </a>
          <a class="sidebar-nav-item" [class.active]="activeTab() === 'explore'" (click)="navigateToTab('explore')">
            <ion-icon [name]="activeTab() === 'explore' ? 'compass' : 'compass-outline'" />
            <span>{{ 'tabs.explore' | translate }}</span>
          </a>
          <a class="sidebar-nav-item" [class.active]="activeTab() === 'profile'" (click)="navigateToTab('profile')">
            <ion-icon [name]="activeTab() === 'profile' ? 'person' : 'person-outline'" />
            <span>{{ 'tabs.profile' | translate }}</span>
          </a>
        </div>
        <div class="sidebar-fab" (click)="onFabTap()">
          <ion-icon name="add" />
        </div>
      </nav>
    }

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
    .desktop-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--wom-sidebar-width, 220px);
      display: flex;
      flex-direction: column;
      background: rgba(var(--ion-background-color-rgb), 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-right: 1px solid rgba(var(--ion-text-color-rgb), 0.08);
      padding: env(safe-area-inset-top, 16px) 12px 16px;
      z-index: 100;
    }

    .sidebar-nav-items {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
    }

    .sidebar-nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 14px;
      color: var(--ion-tab-bar-color, #687076);
      cursor: pointer;
      transition: background-color 0.2s ease, color 0.2s ease;
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;

      ion-icon {
        font-size: 22px;
        flex-shrink: 0;
      }

      &:hover {
        background: rgba(var(--ion-text-color-rgb), 0.06);
      }

      &.active {
        background: rgba(var(--ion-color-primary-rgb), 0.12);
        color: var(--ion-tab-bar-color-selected, #0a7ea4);
        font-weight: 600;
      }
    }

    .sidebar-fab {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast, #fff);
      margin: 16px auto;
      cursor: pointer;
      transition: transform 0.15s ease;
      box-shadow: 0 2px 12px rgba(var(--ion-color-primary-rgb), 0.3);

      &:active {
        transform: scale(0.92);
      }

      ion-icon {
        font-size: 24px;
      }
    }


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
export class TabsPage implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  private _activeTab = signal("home");
  readonly activeTab = this._activeTab.asReadonly();
  readonly isDesktop = signal(false);

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

  ngOnInit(): void {
    const mql = window.matchMedia("(min-width: 768px)");
    this.isDesktop.set(mql.matches);

    const handler = (e: MediaQueryListEvent) => this.isDesktop.set(e.matches);
    mql.addEventListener("change", handler);
    this.destroyRef.onDestroy(() => mql.removeEventListener("change", handler));
  }

  onTabChange(event: { tab: string }): void {
    this._activeTab.set(event.tab);
  }

  navigateToTab(tab: string): void {
    this._activeTab.set(tab);
    this.router.navigate(["/tabs", tab]);
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
