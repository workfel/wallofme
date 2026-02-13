import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private api = inject(ApiService);
  private registered = false;

  async initialize(): Promise<void> {
    if (this.registered) return;
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { PushNotifications } = await import(
        '@capacitor/push-notifications'
      );

      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') return;

      await PushNotifications.register();

      PushNotifications.addListener('registration', async (token: { value: string }) => {
        const platform = Capacitor.getPlatform() as 'ios' | 'android';
        await this.registerToken(token.value, platform);
      });

      PushNotifications.addListener('registrationError', (error: { error: string }) => {
        console.error('Push registration error:', error);
      });

      this.registered = true;
    } catch {
      // Push not available (web or simulator)
    }
  }

  async registerToken(token: string, platform: string): Promise<void> {
    try {
      await this.api.client.api.social.notifications.register.$post({
        json: { token, platform: platform as 'ios' | 'android' | 'web' },
      });
    } catch {
      // silently fail
    }
  }

  async unregisterToken(token: string): Promise<void> {
    try {
      await this.api.client.api.social.notifications.unregister.$delete({
        json: { token },
      });
    } catch {
      // silently fail
    }
  }
}
