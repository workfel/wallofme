# WallOfMe — Remaining Phases

## Done ✅

- Decorations catalog + floor placement + interactive 3D gizmos
- Theme system + selector
- Token economy backend (balance, transactions, earn)
- AdMob rewarded videos
- Share room (slug + sheet)
- Camera inspection mode
- Editor toolbar + context actions
- Non-destructive loading overlay
- Share button fix (`@capacitor/share`)
- AdMob listener cleanup fix

## In Progress 🚧

- [ ] **Paiements** : RevenueCat Web Billing + Apple IAP hybrid
  - iOS natif → Apple IAP via Capacitor SDK (30% commission)
  - Android + Web → RevenueCat Web Purchase Links → Stripe (~3%)
  - Token packs consommables (pas des abonnements)
  - Même `app_user_id` (BetterAuth `user.id`) partout

## À faire 📋

- [ ] **Grille 9×6** : Agrandir grille trophées muraux de 3×2 à 9×6
- [ ] **TrophyInfoSheet** : Tap trophée → zoom caméra + infos course en bottom sheet
- [ ] **Screenshot capture** : `toDataURL` + overlay branding pour partage
- [ ] **OG meta tags** : Image preview pour liens partagés
- [ ] **Deep linking** : `wallofme://room/{slug}` → ouvrir room
- [ ] **AdMob prod** : Créer vrai ad unit dans console AdMob
- [ ] **Env prod** : URLs backend, API keys, ad units
- [ ] **Décorations déblocables** : Achievements (10 courses → Bronze rack, etc.)
- [ ] **Login quotidien** : Bonus Flames + streak
- [ ] **Performance** : DPR cap, demand rendering, Draco GLB compression
- [ ] **Referral** : Système de parrainage Flames bonus
