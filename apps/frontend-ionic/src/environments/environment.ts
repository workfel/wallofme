// For native device testing, use your machine's network IP instead of localhost.
// localhost refers to the device itself on Android/iOS, not your dev machine.
export const environment = {
  production: false,
  apiUrl: "http://localhost:3333",
  r2PublicUrl: "http://localhost:3333/cdn",
  revenueCat: {
    apiKey: "test_QEJHSVEYBAtNAnbuxKcQMkSRUqW",       // Capacitor iOS (Apple IAP)
    webApiKey: "rcb_sb_YzwEVuZjxZTuatoqNHjplHBus", // Web Billing (Stripe)
  },
  admob: {
    // Use AdMob test ad unit IDs for development
    rewardedAdId: "ca-app-pub-3940256099942544/5224354917",
  },
};
