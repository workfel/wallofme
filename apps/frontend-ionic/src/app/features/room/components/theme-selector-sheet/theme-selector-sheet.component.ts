import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBadge,
  IonIcon,
  IonAlert,
  IonModal,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, lockClosedOutline, flameOutline, colorPaletteOutline } from 'ionicons/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '@app/core/services/theme.service';
import { TokenService } from '@app/core/services/token.service';
import { ApiService } from '@app/core/services/api.service';
import { AuthService } from '@app/core/services/auth.service';
import { RoomTheme, BUILT_IN_THEMES, CUSTOM_THEME_ID } from '@app/types/room-theme';
import { UpgradePromptComponent } from '@app/shared/components/upgrade-prompt/upgrade-prompt.component';

@Component({
  selector: 'app-theme-selector-sheet',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBadge,
    IonIcon,
    IonAlert,
    IonModal,
    TranslateModule,
    UpgradePromptComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'room.themes' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button
            (click)="onApply()"
            [strong]="true"
            [disabled]="!canApplySelected()"
          >
            {{ 'common.apply' | translate }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="theme-grid">
        @for (t of themes; track t.slug) {
          <button
            class="theme-card"
            [class.selected]="selectedTheme()?.slug === t.slug"
            [class.locked]="!t.isFree && !isOwned(t)"
            (click)="selectTheme(t)"
          >
            <div class="theme-preview" [style.background]="t.background">
              <div class="mini-room">
                <div class="wall-left" [style.background]="t.leftWall.color"></div>
                <div class="wall-back" [style.background]="t.backWall.color"></div>
                <div class="floor" [style.background]="t.floor.color"></div>
              </div>
              @if (!t.isFree && !isOwned(t)) {
                <div class="lock-overlay">
                  <ion-icon name="lock-closed-outline" />
                </div>
              }
            </div>
            <span class="theme-name">{{ t.name }}</span>
            @if (t.isFree || isOwned(t)) {
              <ion-badge color="success">FREE</ion-badge>
            } @else {
              <ion-badge color="warning">
                <ion-icon name="flame-outline" /> {{ t.priceTokens }}
              </ion-badge>
            }
            @if (selectedTheme()?.slug === t.slug) {
              <ion-icon name="checkmark-outline" color="primary" class="check" />
            }
          </button>
        }

        <!-- Custom Theme Card -->
        <button
          class="theme-card"
          [class.selected]="isCustomSelected()"
          (click)="onOpenCustomEditor()"
        >
          <div class="theme-preview custom-preview">
            <ion-icon name="color-palette-outline" class="custom-icon" />
          </div>
          <span class="theme-name">{{ 'room.custom' | translate }}</span>
          <ion-badge color="success">FREE</ion-badge>
          @if (isCustomSelected()) {
            <ion-icon name="checkmark-outline" color="primary" class="check" />
          }
        </button>
      </div>
    </ion-content>

    <ion-alert
      [isOpen]="showUnlockAlert()"
      [header]="'room.unlockTheme' | translate"
      [message]="unlockMessage()"
      [buttons]="unlockButtons"
      (didDismiss)="showUnlockAlert.set(false)"
    />

    <!-- Upgrade prompt for non-Pro users -->
    <ion-modal [isOpen]="showUpgradePrompt()" (didDismiss)="showUpgradePrompt.set(false)">
      <ng-template>
        <app-upgrade-prompt
          [feature]="'pro.featureThemes' | translate"
          (dismiss)="showUpgradePrompt.set(false)"
        />
      </ng-template>
    </ion-modal>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .theme-card {
      background: none;
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 0;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      position: relative;
      transition: border-color 0.2s;

      &.selected {
        border-color: var(--ion-color-primary);
      }
    }

    .theme-preview {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }

    .lock-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;

      ion-icon {
        font-size: 28px;
        color: white;
      }
    }

    .mini-room {
      position: absolute;
      bottom: 10%;
      left: 15%;
      right: 15%;
      top: 20%;

      .wall-left {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 30%;
        width: 35%;
        border-radius: 2px;
      }
      .wall-back {
        position: absolute;
        left: 30%;
        top: 0;
        right: 0;
        height: 65%;
        border-radius: 2px;
      }
      .floor {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 35%;
        border-radius: 2px;
      }
    }

    .custom-preview {
      background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3) !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .custom-icon {
      font-size: 32px;
      color: white;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .theme-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .check {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 20px;
    }

    ion-badge {
      font-size: 10px;

      ion-icon {
        font-size: 10px;
        vertical-align: middle;
      }
    }
  `,
})
export class ThemeSelectorSheetComponent implements OnInit {
  private themeService = inject(ThemeService);
  private tokenService = inject(TokenService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);

  currentTheme = input<RoomTheme>();

  preview = output<RoomTheme>();
  apply = output<RoomTheme | null>();
  openCustomEditor = output<void>();

  themes = BUILT_IN_THEMES;
  selectedTheme = signal<RoomTheme | null>(null);
  ownedThemeSlugs = signal<Set<string>>(new Set());

  showUnlockAlert = signal(false);
  showUpgradePrompt = signal(false);
  unlockMessage = signal('');
  private pendingUnlockTheme: RoomTheme | null = null;

  unlockButtons = [
    { text: this.translate.instant('common.cancel'), role: 'cancel' },
    {
      text: this.translate.instant('room.unlock'),
      handler: () => this.doUnlock(),
    },
  ];

  constructor() {
    addIcons({ checkmarkOutline, lockClosedOutline, flameOutline, colorPaletteOutline });
  }

  ngOnInit() {
    const current = this.currentTheme();
    if (current) {
      this.selectedTheme.set(current);
    }
    this.fetchOwnedThemes();
  }

  isCustomSelected(): boolean {
    return this.currentTheme()?.id === CUSTOM_THEME_ID;
  }

  onOpenCustomEditor(): void {
    this.openCustomEditor.emit();
  }

  isOwned(theme: RoomTheme): boolean {
    return theme.isFree || this.ownedThemeSlugs().has(theme.slug);
  }

  canApplySelected(): boolean {
    const theme = this.selectedTheme();
    if (!theme) return false;
    return theme.isFree || this.isOwned(theme);
  }

  selectTheme(t: RoomTheme): void {
    if (!t.isFree && !this.isOwned(t)) {
      // Show upgrade prompt for non-Pro users instead of token unlock
      if (!this.authService.user()?.isPro) {
        this.showUpgradePrompt.set(true);
        return;
      }
      this.pendingUnlockTheme = t;
      this.unlockMessage.set(
        this.translate.instant('room.unlockThemeMessage', {
          name: t.name,
          price: t.priceTokens,
        })
      );
      this.showUnlockAlert.set(true);
      return;
    }
    this.selectedTheme.set(t);
    this.preview.emit(t);
  }

  onApply(): void {
    if (this.canApplySelected()) {
      this.apply.emit(this.selectedTheme());
    }
  }

  private async fetchOwnedThemes(): Promise<void> {
    try {
      const res = await this.api.client.api.themes.inventory.me.$get();
      if (res.ok) {
        const json = await res.json();
        const slugs = new Set<string>();
        for (const item of json.data) {
          if (item.theme) {
            slugs.add(item.theme.slug);
          }
        }
        this.ownedThemeSlugs.set(slugs);
      }
    } catch {
      // Ignore - owned themes will appear locked
    }
  }

  private async doUnlock(): Promise<void> {
    const theme = this.pendingUnlockTheme;
    if (!theme || !theme.id) return;

    try {
      const res = await this.api.client.api.themes[':id'].acquire.$post({
        param: { id: theme.id },
      });
      if (res.ok) {
        this.ownedThemeSlugs.update((set) => {
          const next = new Set(set);
          next.add(theme.slug);
          return next;
        });
        this.tokenService.fetchBalance();
        this.selectedTheme.set(theme);
        this.preview.emit(theme);
      }
    } catch {
      // Handle error - insufficient tokens etc.
    }
    this.pendingUnlockTheme = null;
  }
}
