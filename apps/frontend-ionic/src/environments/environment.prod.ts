export const environment = {
  production: true,
  apiUrl: "https://api-wallofme.workfel.cloud/",
  appUrl: "https://wallofme.com",
  revenueCat: {
    apiKey: "test_QEJHSVEYBAtNAnbuxKcQMkSRUqW", // Capacitor iOS (Apple IAP)
    webApiKey: "rcb_sb_YzwEVuZjxZTuatoqNHjplHBus", // Web Billing (Stripe)
  },
  admob: {
    // Use AdMob test ad unit IDs for development
    rewardedAdId: "ca-app-pub-3940256099942544/5224354917",
  },
  encryptPayloads: true,
  encryptionKey:
    "01e9a0e14961ac821c643e40b60884c67498bbc55a36ccdd001cfc033d2726e5", // Set this to the same key as ENCRYPTION_KEY in backend .env
};
