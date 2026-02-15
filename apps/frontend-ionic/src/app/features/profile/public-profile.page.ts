import { Component, inject, input, signal, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import {
  IonChip,
  IonContent,
  IonIcon,
  IonSpinner,
  IonText,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  arrowBackOutline,
  cubeOutline,
  personCircleOutline,
  ribbonOutline,
  documentTextOutline,
} from "ionicons/icons";

import { ApiService } from "@app/core/services/api.service";
import { ProBadgeComponent } from "@app/shared/components/pro-badge/pro-badge.component";

interface PublicProfile {
  id: string;
  displayName: string | null;
  firstName: string | null;
  image: string | null;
  country: string | null;
  sports: string[];
  isPro: boolean;
  trophyCount: number;
  likeCount: number;
  viewCount: number;
  trophies: { id: string; type: string; thumbnailUrl: string | null }[];
}

@Component({
  selector: "app-public-profile",
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonText,
    IonChip,
    IonSpinner,
    IonIcon,
    ProBadgeComponent,
  ],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="true">
      <!-- Banner -->
      <div class="banner">
        <!-- Floating toolbar over banner -->
        <div class="floating-toolbar">
          <button class="toolbar-pill" (click)="goBack()">
            <ion-icon name="arrow-back-outline" />
          </button>
          <div class="toolbar-spacer"></div>
        </div>
      </div>

      @if (loading()) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (profile(); as p) {
        <!-- Card body with rounded top corners -->
        <div class="card-body">
          <!-- Avatar overlapping banner / card -->
          <div class="avatar-anchor">
            <div class="avatar-ring">
              @if (p.image) {
                <img [src]="p.image" alt="avatar" class="avatar-img" />
              } @else {
                <div class="avatar-placeholder-wrapper">
                  <ion-icon
                    name="person-circle-outline"
                    class="avatar-placeholder"
                  />
                </div>
              }
            </div>
          </div>

          <!-- Profile info -->
          <div class="profile-info animate-fade-in">
            <h2 class="display-name">
              {{ p.displayName || p.firstName }}
              @if (p.isPro) {
                <app-pro-badge size="medium" />
              }
            </h2>

            @if (p.country) {
              <p class="subtitle-label">{{ p.country }}</p>
            }

            @if (p.sports.length > 0) {
              <div class="sport-chips">
                @for (sport of p.sports; track sport) {
                  <ion-chip outline color="primary" class="sport-chip">
                    {{ "sports." + sport | translate }}
                  </ion-chip>
                }
              </div>
            }
          </div>

          <!-- Stats row -->
          <div class="stats-row animate-fade-in-up">
            <div class="stat-item">
              <span class="stat-value">{{ formatCount(p.trophyCount) }}</span>
              <span class="stat-label">{{
                "profile.statTrophies" | translate
              }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ formatCount(p.likeCount) }}</span>
              <span class="stat-label">{{
                "profile.statLikes" | translate
              }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ formatCount(p.viewCount) }}</span>
              <span class="stat-label">{{
                "profile.statViews" | translate
              }}</span>
            </div>
          </div>

          <!-- Visit Pain Cave button -->
          <div class="action-row">
            <button class="action-btn primary" (click)="visitRoom()">
              <ion-icon name="cube-outline" />
              {{ "publicProfile.visitRoom" | translate }}
            </button>
          </div>

          <!-- Trophy Grid -->
          @if (p.trophies.length === 0) {
            <div class="empty-state animate-fade-in">
              <ion-icon name="ribbon-outline" class="empty-icon" />
              <ion-text color="medium">
                <p>{{ "publicProfile.noTrophies" | translate }}</p>
              </ion-text>
            </div>
          } @else {
            <div class="trophy-grid animate-fade-in-up">
              @for (t of p.trophies; track t.id) {
                <div class="trophy-cell">
                  @if (t.thumbnailUrl) {
                    <img
                      [src]="t.thumbnailUrl"
                      [alt]="t.type"
                      class="trophy-img"
                      loading="lazy"
                    />
                  } @else {
                    <div class="trophy-fallback">
                      <ion-icon
                        [name]="
                          t.type === 'medal'
                            ? 'ribbon-outline'
                            : 'document-text-outline'
                        "
                      />
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="centered">
          <ion-text color="medium">
            <p>{{ "common.error" | translate }}</p>
          </ion-text>
        </div>
      }
    </ion-content>
  `,
  styles: `
    :host {
      --toolbar-top: var(--ion-safe-area-top, 20px);
      --banner-height: 220px;
      --avatar-size: 110px;
      --avatar-overlap: 55px;
    }

    /* Global Background */
    ion-content {
      --background: radial-gradient(circle at 50% 0%, #e0f7fa 0%, #f0f4f8 100%);
    }

    /* Glass Card Shared Styles */
    .glass-card {
      background: rgba(255, 255, 255, 0.65);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      border-radius: 32px;
    }

    /* ── Banner ─────────────────────────────── */
    .banner {
      position: relative;
      height: var(--banner-height);
      background: linear-gradient(
        135deg,
        #1a1a1a 0%,
        #2c3e50 100%
      ); /* Darker rich banner */
      overflow: hidden;
      border-bottom-left-radius: 40px;
      border-bottom-right-radius: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      margin-bottom: 20px;

      &::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(
            circle at 20% 80%,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 50%
          ),
          radial-gradient(
            circle at 80% 20%,
            rgba(255, 255, 255, 0.05) 0%,
            transparent 40%
          );
      }
    }

    .floating-toolbar {
      position: absolute;
      top: calc(var(--toolbar-top) + 8px);
      left: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }

    .toolbar-pill {
      width: 44px; /* Larger touch target */
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #fff;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.18s ease;

      &:active {
        transform: scale(0.9);
        background: rgba(0, 0, 0, 0.6);
      }

      ion-icon {
        font-size: 22px;
      }
    }

    .toolbar-spacer {
      width: 44px;
    }

    /* ── Card body ───────────────────────────── */
    .card-body {
      position: relative;
      margin: -80px 16px 20px; /* Pull up over banner */
      padding-top: calc(var(--avatar-overlap) + 8px);
      min-height: 200px;
      background: rgba(255, 255, 255, 0.65);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      border-radius: 32px;
    }

    /* ── Avatar ──────────────────────────────── */
    .avatar-anchor {
      position: absolute;
      top: calc(-1 * var(--avatar-overlap));
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      z-index: 5;
    }

    .avatar-ring {
      width: var(--avatar-size);
      height: var(--avatar-size);
      border-radius: 50%;
      border: 4px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      background: var(--ion-color-step-100);
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-placeholder-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-step-100);
    }

    .avatar-placeholder {
      font-size: 72px;
      color: var(--ion-color-step-300);
    }

    /* ── Profile info ───────────────────────── */
    .profile-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 24px 0;
    }

    .display-name {
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 4px;
      text-align: center;
      letter-spacing: -0.02em;
      color: var(--ion-text-color);
    }

    .subtitle-label {
      font-size: 15px;
      color: var(--ion-color-step-600);
      margin: 2px 0 0;
      font-weight: 500;
    }

    .sport-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      margin-top: 12px;
    }

    .sport-chip {
      height: 28px;
      font-size: 12px;
      margin: 0;
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      color: var(--ion-color-primary);
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
      font-weight: 600;
      --padding-start: 12px;
      --padding-end: 12px;
    }

    /* ── Stats row ──────────────────────────── */
    .stats-row {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 24px 16px 0;
      padding: 16px 0;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--ion-text-color);
    }

    .stat-label {
      font-size: 11px;
      color: var(--ion-color-step-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
    }

    .stat-divider {
      width: 1px;
      height: 28px;
      background: rgba(0, 0, 0, 0.1);
    }

    /* ── Action button ──────────────────────── */
    .action-row {
      display: flex;
      justify-content: center;
      padding: 24px 24px 28px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 32px;
      border-radius: 100px;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease;

      &:active {
        transform: scale(0.96);
      }

      ion-icon {
        font-size: 20px;
      }
    }

    .action-btn.primary {
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      border: none;
      box-shadow: 0 4px 16px rgba(var(--ion-color-primary-rgb), 0.4);
    }

    /* ── Trophy grid ────────────────────────── */
    .trophy-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 0 16px 40px; /* outside the glass card now? No, inside */
    }

    /* Modify trophy grid to be INSIDE or OUTSIDE card? 
       The HTML structure has it inside .card-body. 
       Let's keep it there but style appropriately. 
    */
    .card-body .trophy-grid {
      padding: 0 16px 32px;
    }

    .trophy-cell {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.6);
    }

    .trophy-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .trophy-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);

      ion-icon {
        font-size: 32px;
        color: rgba(var(--ion-color-primary-rgb), 0.5);
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 24px;
      text-align: center;

      .empty-icon {
        font-size: 48px;
        color: rgba(var(--ion-color-medium-rgb), 0.5);
        margin-bottom: 12px;
      }

      p {
        margin: 0;
        font-size: 15px;
        color: var(--ion-color-medium);
        font-weight: 500;
      }
    }

    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  `,
})
export class PublicProfilePage implements OnInit {
  userId = input.required<string>();

  private api = inject(ApiService);
  private router = inject(Router);
  private location = inject(Location);

  profile = signal<PublicProfile | null>(null);
  loading = signal(true);

  constructor() {
    addIcons({
      arrowBackOutline,
      cubeOutline,
      personCircleOutline,
      ribbonOutline,
      documentTextOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.users[":id"].$get({
        param: { id: this.userId() },
      });
      if (res.ok) {
        const json = await res.json();
        this.profile.set(json.data as PublicProfile);
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.location.back();
  }

  visitRoom(): void {
    this.router.navigate(["/room", this.userId()]);
  }

  formatCount(count: number): string {
    if (count >= 1_000_000) {
      return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (count >= 1_000) {
      return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return count.toString();
  }
}
