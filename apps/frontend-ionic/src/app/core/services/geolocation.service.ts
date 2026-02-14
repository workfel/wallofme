import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  async getCurrentPosition(): Promise<{
    latitude: number;
    longitude: number;
  } | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        const perm = await Geolocation.checkPermissions();
        if (perm.location === 'denied') {
          const req = await Geolocation.requestPermissions();
          if (req.location === 'denied') return null;
        }
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
        });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      }

      // Web fallback
      if (!navigator.geolocation) return null;

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 10000 },
        );
      });
    } catch {
      return null;
    }
  }
}
