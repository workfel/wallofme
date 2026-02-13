# WallOfMe — MVP Scope & Business Model

> Last updated: 2026-02-13

## Vision

"The Metaverse of the Athlete" — Athletes capture race photos, auto-extract results via AI, and display achievements in a 3D virtual "Pain Cave" room. Social discovery and gamification drive engagement.

**Target:** All competition sports — running, trail, triathlon, Ironman, Hyrox, cyclo-sportive, CrossFit, OCR, swimming, etc.

**Platforms:** Web (priority) + iOS + Android

**Launch:** Friends & early adopters group → App Store / Web public launch

---

## Business Model: Hybrid (Free + Pro + Tokens)

### Revenue Streams

| Stream | Target Users | Revenue Type | Commission |
|---|---|---|---|
| Rewarded video ads (AdMob) | Free users | Per-view (~$0.01-0.05) | None |
| Token IAP (RevenueCat) | Casual spenders | One-time purchases | Apple 30% / Google 30% / Stripe 3% (web) |
| Pro subscription (RevenueCat) | Power users | Recurring monthly/annual | Apple 30%→15% Y2 / Google 30%→15% Y2 / Stripe 3% (web) |

### Tier Breakdown

#### FREE TIER

| Feature | Limit |
|---|---|
| Trophy scans (AI analyze + bg removal) | **3 per month** |
| Room editing | Full access |
| Decorations | Free decorations only (earn tokens for premium) |
| Themes | Default theme + free themes |
| Custom theme colors | No |
| Social (likes, views, explore) | Full access |
| Room sharing | Full access |
| Push notifications | Full access |
| Rewarded video ads | 5/day, 20min cooldown → 15 tokens each |
| Daily login bonus | 5 tokens/day |
| Token purchases (IAP) | Full access |

#### PRO SUBSCRIPTION

| Feature | Detail |
|---|---|
| Trophy scans | **Unlimited** |
| All premium themes | Unlocked (included) |
| Custom theme colors | Full access (wall, floor, background) |
| Ad-free experience | No rewarded ads shown (can still watch voluntarily for tokens) |
| Monthly token bonus | **100 tokens/month** (credited on renewal) |
| Pro badge | Visible on profile + room (social proof) |
| Priority support | In-app support channel |

**Pricing:**

| Plan | Mobile (iOS/Android) | Web (Stripe) | Savings |
|---|---|---|---|
| Monthly | $4.99/month | $3.99/month | Web -20% (no Apple tax) |
| Annual | $29.99/year ($2.50/mo) | $24.99/year ($2.08/mo) | -50% vs monthly |

> Web pricing advantage: communicate "Subscribe on web to save 20%" in-app. This is allowed by Apple/Google as of 2024 ruling (can mention external pricing exists, link from account settings).

#### TOKEN ECONOMY (unchanged)

**Earning tokens (free + pro):**

| Method | Tokens | Limit |
|---|---|---|
| Rewarded video (AdMob) | 15 | 5/day, 20min cooldown |
| Daily login | 5 | 1/day |
| Pro monthly bonus | 100 | Pro only, on renewal |
| IAP purchase | varies | No limit |

**Token packs (IAP):**

| Pack | Price | Tokens | Bonus |
|---|---|---|---|
| Starter | $0.99 | 100 | — |
| Popular | $4.99 | 550 | +10% |
| Value | $9.99 | 1,200 | +20% |
| Premium | $19.99 | 2,600 | +30% |
| Ultimate | $49.99 | 7,000 | +40% |

**Spending tokens:**
- Premium decorations (50-500 tokens each)
- Premium themes (100-300 tokens each, or included with Pro)
- Future: special room layouts, animated effects, etc.

### Conversion Funnel

```
New User (free)
│
├─ Scans 3 trophies → hits monthly limit
│  └─ Prompt: "Upgrade to Pro for unlimited scans"
│
├─ Sees premium decoration → not enough tokens
│  └─ Prompt: "Watch ad for 15 tokens" or "Buy token pack"
│
├─ Explores rooms → sees Pro badges
│  └─ Social proof drives Pro interest
│
├─ Visits token store → sees Pro value comparison
│  └─ "Pro = 100 tokens/mo + unlimited scans + all themes"
│
└─ Receives "subscribe on web to save 20%" nudge
   └─ Web subscription (lower commission for us)
```

---

## MVP Feature Scope

### DONE — Ready for launch

| # | Feature | Notes |
|---|---|---|
| 1 | Auth (email + Google + Apple OAuth) | BetterAuth + Capacitor plugin |
| 2 | Onboarding (name, country) | Guards in place |
| 3 | Trophy scan pipeline (photo → AI → bg removal → review) | Full pipeline working |
| 4 | 3D Pain Cave room viewer | angular-three, isometric |
| 5 | Room editor (drag-drop, catalog, wall/floor placement) | Full feature |
| 6 | Decoration shop (catalog, inventory, acquire with tokens) | Token debit working |
| 7 | Theme system (built-in + custom colors) | Persistence working |
| 8 | Token economy backend (balance, transactions, earn/spend) | Complete |
| 9 | Token store UI (IAP packs + rewarded ads + daily login) | RevenueCat + AdMob |
| 10 | Room sharing (link, OG tags, screenshot, deep link) | Capacitor Share API |
| 11 | Social (likes, views, like toggle) | Optimistic updates |
| 12 | Push notifications (device tokens, room_liked) | Native only |
| 13 | RevenueCat webhooks (server-side token crediting) | Idempotent |
| 14 | Trophy detail page | With race info |

### TO BUILD — MVP blockers

#### P0 — Must have for launch

| # | Feature | Effort | Description |
|---|---|---|---|
| 15 | **Explore page** | Medium | Feed of rooms: recent + popular + search by athlete name. Grid of room cards with thumbnail, athlete name, sport, like count. Tap → view room. |
| 16 | **Scan limit (3/month free)** | Small | Backend: track monthly scan count per user. Return remaining scans in `/users/me`. Block `/scan/analyze` when limit reached (unless Pro). Frontend: show remaining scans, upgrade prompt when 0. |
| 17 | **Pro subscription (RevenueCat)** | Medium | Backend: RevenueCat subscription webhook → set `user.isPro = true/false`. Monthly token bonus (100 tokens on renewal). Frontend: Pro upgrade page, manage subscription, restore purchases. |
| 18 | **Pro badge** | Small | Visual badge on profile + room share page when `isPro`. |
| 19 | **Profile settings (functional)** | Small | Edit firstName, lastName, country, avatar. Backend endpoint `PATCH /users/me`. Language switching (already i18n setup, just wire toggle). |
| 20 | **Web billing flow** | Small | RevenueCat Web Billing / Stripe checkout for Pro subscription on web (bypass Apple 30%). Already partially set up for token packs. |
| 35 | **I18n** | Small | Translation of all strings and UI elements to support multiple languages( "fr", "en") |

#### P1 — Should have for good launch experience

| # | Feature | Effort | Description |
|---|---|---|---|
| 21 | **Upgrade prompts (contextual)** | Small | Show upgrade-to-Pro prompts at key moments: scan limit hit, premium theme tap, token store page. Consistent CTA component. |
| 22 | **Room thumbnail generation** | Small | Auto-generate room thumbnail on save (for Explore page cards). Can use existing screenshot logic server-side or save last screenshot. |
| 23 | **Explore page - filters** | Small | Filter by sport type, country. Sort by recent / popular / most liked. |
| 24 | **Onboarding - sport selection** | Small | Add sport(s) selection during onboarding. Stores in user profile. Used for Explore filtering + personalization. |
| 25 | **Production environment** | Small | Production API URL, AdMob prod ad units, RevenueCat prod keys, R2 prod bucket. |

#### P2 — Nice to have (post-launch iteration)

| # | Feature | Effort | Description |
|---|---|---|---|
| 26 | Follow system | Medium | Follow athletes, feed of followed rooms updates |
| 27 | Leaderboard / rankings | Medium | Most liked rooms, most trophies, by sport/country |
| 28 | Achievement decorations | Medium | Auto-unlock decos at milestones (10 races → Bronze rack, etc.) |
| 29 | Referral system | Medium | Invite friend → both get bonus tokens |
| 30 | Animated decorations | Small | Premium animated 3D objects (spinning trophy, flame effects) |
| 31 | Room layouts | Medium | Different room shapes/sizes (garage, podium, etc.) |
| 32 | Race results web scraper | Medium | Auto-find official race results from scan data |
| 33 | Admin panel | Medium | Manage decorations, themes, users, analytics |
| 34 | Notification center | Small | In-app notification list (beyond push) |

---

## Implementation Priority Order

### Sprint 1 — Core MVP completion

1. **#16 Scan limit** — Backend + frontend (small, high impact on business model)
2. **#19 Profile settings** — Wire existing UI to backend (small, QoL)
3. **#24 Onboarding sport selection** — Add sport picker (small, needed for Explore)

### Sprint 2 — Explore & Discovery

4. **#15 Explore page** — Room feed with cards, search, basic sorting
5. **#22 Room thumbnail** — Auto-capture for Explore cards
6. **#23 Explore filters** — Sport, country, sort options

### Sprint 3 — Pro Subscription

7. **#17 Pro subscription** — RevenueCat subscription + webhook + isPro logic
8. **#20 Web billing** — Stripe checkout for web Pro (lower commission)
9. **#18 Pro badge** — Visual badge on profile + rooms
10. **#21 Upgrade prompts** — Contextual CTAs at limit points

### Sprint 4 — Production & Launch

11. **#25 Production environment** — Prod configs, real ad units, SSL, domain
12. **#35 I18n** Traductions de l'application homogène.
12. App Store submission (iOS + Android)
13. Web deployment (custom domain)
14. Monitoring & analytics setup

---

## Key Metrics to Track

| Metric | Target (Month 1) | Why |
|---|---|---|
| DAU / MAU ratio | >20% | Engagement health |
| Scan completion rate | >60% | Core feature works |
| Free → Pro conversion | 3-5% | Revenue viability |
| Token purchase rate (free users) | 5-10% | Micro-transaction appeal |
| Rewarded ad views / user / day | 1-2 | Ad revenue baseline |
| Room shares / user / month | >1 | Virality indicator |
| Explore page visit rate | >50% of DAU | Discovery works |
| Avg session duration | >3 min | Engagement depth |
| D7 retention | >30% | Product-market fit signal |
| ARPU (all users) | $0.50-1.00 | Revenue per user |
| ARPPU (paying users) | $5-10 | Paying user value |

---

## Revenue Projections (Conservative)

Assuming 1,000 MAU after 3 months:

| Source | Users | Rate | Monthly Revenue |
|---|---|---|---|
| Pro subscription | 30-50 (3-5%) | $4.99/mo avg | $150-250 |
| Token IAP | 50-100 (5-10%) | $3/mo avg | $150-300 |
| Rewarded ads | 500 (50%) | 1.5 views/day × $0.02 | $450 |
| **Total** | | | **$750-1,000/mo** |

At 10,000 MAU:

| Source | Users | Rate | Monthly Revenue |
|---|---|---|---|
| Pro subscription | 300-500 | $4.99/mo avg | $1,500-2,500 |
| Token IAP | 500-1,000 | $3/mo avg | $1,500-3,000 |
| Rewarded ads | 5,000 | 1.5 views/day × $0.02 | $4,500 |
| **Total** | | | **$7,500-10,000/mo** |

> Note: After Apple/Google commission (30% on IAP/subs), net revenue is ~70% of above for mobile transactions. Web transactions (Stripe 3%) are significantly more profitable.

---

## Technical Implementation Notes

### Scan Limit (#16)

**Backend changes:**
- Add `monthlyScansUsed` counter to user or track via `trophy` table (count trophies created this month)
- Add `scanLimit` field (default 3, null for Pro = unlimited)
- Middleware check on `/scan/analyze`: if `!isPro && monthlyScansUsed >= 3` → return 403 with `{ error: "scan_limit_reached", remaining: 0 }`
- Add `GET /users/me` response field: `scansRemaining: number | null` (null = unlimited)

**Frontend changes:**
- Display "X scans remaining" on home page / scan button
- When 0: overlay on scan button → "Upgrade to Pro" CTA
- Toast notification when scan succeeds: "2 scans remaining this month"

### Pro Subscription (#17)

**RevenueCat setup:**
- Create subscription products: `wallofme_pro_monthly` ($4.99), `wallofme_pro_annual` ($29.99)
- Web billing: Stripe checkout integration via RevenueCat
- Webhook events to handle: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`

**Backend changes:**
- `POST /webhooks/revenuecat` — extend to handle subscription events
- On `INITIAL_PURCHASE` / `RENEWAL`: set `user.isPro = true`, credit 100 bonus tokens
- On `CANCELLATION` / `EXPIRATION`: set `user.isPro = false`
- Add `proExpiresAt` field to user (for grace period handling)

**Frontend changes:**
- Pro upgrade page: feature comparison, pricing, CTA buttons
- RevenueCat SDK: `purchasePackage()` for native, web billing link for web
- Restore purchases button
- Pro badge component (reusable)

### Explore Page (#15)

**Backend changes:**
- `GET /rooms/explore` — public endpoint, paginated
  - Query params: `sort` (recent/popular/liked), `sport`, `country`, `search` (athlete name)
  - Returns: room card data (userId, displayName, sport, thumbnailUrl, likeCount, trophyCount)
  - Sorting: recent = by updatedAt, popular = by viewCount, liked = by likeCount

**Frontend changes:**
- Explore page with:
  - Search bar (athlete name)
  - Filter chips (sport, country)
  - Sort toggle (recent / popular)
  - Grid of room cards (thumbnail, name, sport, likes)
  - Infinite scroll pagination
  - Tap → navigate to `/room/:userId`

### Sport Selection (#24)

**Backend changes:**
- Add `sports` field to user table (text array or JSON)
- Update onboarding endpoint to accept sports
- Add sport enum or free-text with suggestions

**Frontend changes:**
- Multi-select sport picker in onboarding (running, trail, triathlon, cycling, CrossFit, swimming, OCR, etc.)
- Editable in profile settings
