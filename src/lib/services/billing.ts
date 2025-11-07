// $lib/services/billing.ts
import { browser } from '$app/environment';
import type { IAPProduct } from '@awesome-cordova-plugins/in-app-purchase-2';
import { Preferences } from '@capacitor/preferences';

export interface SubscriptionStatus {
  isVip: boolean;
  subscriptionId: string | null;
  expiryDate: Date | null;
}

class BillingService {
  private isInitialized = false;
  private vipSubscriptionSku = 'wordrush_vip_weekly'; // Your subscription SKU
  private IAP2: any = null; // will hold the plugin instance

  private async loadPlugin() {
    if (!this.IAP2 && browser) {
      const module = await import('@awesome-cordova-plugins/in-app-purchase-2');
      this.IAP2 = module;
    }
  }

  async initialize() {
    try {
      if (!browser) return; // skip SSR
      await this.loadPlugin();

      if (!this.isInitialized && this.IAP2) {
        this.IAP2.register({
          id: this.vipSubscriptionSku,
          type: this.IAP2.CONSUMABLE // or SUBSCRIPTION if you prefer
        });

        this.IAP2.refresh();

        this.IAP2.when(this.vipSubscriptionSku).approved(async (product: IAPProduct) => {
          await this.IAP2.finish(product);
          await this.saveSubscriptionStatus(
            true,
            product.transaction?.id ?? null,
            product.expirationDate ? new Date(product.expirationDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          );
        });

        this.isInitialized = true;
        console.log('Billing service initialized');

        // Restore existing purchases
        await this.checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('Failed to initialize billing:', error);
    }
  }

  async purchaseVipSubscription(): Promise<boolean> {
    if (!browser) return false;
    await this.loadPlugin();

    if (!this.IAP2) return false;

    try {
      const product: IAPProduct = await this.IAP2.order(this.vipSubscriptionSku);
      if (product.owned || product.transaction) {
        await this.saveSubscriptionStatus(
          true,
          product.transaction?.id ?? null,
          product.expirationDate ? new Date(product.expirationDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        );
        return true;
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    }
    return false;
  }

  async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    if (!browser) return await this.getLocalSubscriptionStatus();
    await this.loadPlugin();

    if (!this.IAP2) return await this.getLocalSubscriptionStatus();

    try {
      const product: IAPProduct = this.IAP2.getProducts().find((p: IAPProduct) => p.id === this.vipSubscriptionSku);

      if (product?.owned) {
        const status: SubscriptionStatus = {
          isVip: true,
          subscriptionId: product.transaction?.id || null,
          expiryDate: product.expirationDate ? new Date(product.expirationDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
        await this.saveSubscriptionStatus(status.isVip, status.subscriptionId, status.expiryDate);
        return status;
      }

      await this.saveSubscriptionStatus(false, null, null);
      return { isVip: false, subscriptionId: null, expiryDate: null };
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return await this.getLocalSubscriptionStatus();
    }
  }

  private async saveSubscriptionStatus(isVip: boolean, subscriptionId: string | null, expiryDate: Date | null) {
    const status: SubscriptionStatus = { isVip, subscriptionId, expiryDate };
    await Preferences.set({ key: 'subscription_status', value: JSON.stringify(status) });
  }

  private async getLocalSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const { value } = await Preferences.get({ key: 'subscription_status' });
      if (value) {
        const status: SubscriptionStatus = JSON.parse(value);

        if (status.expiryDate && new Date(status.expiryDate) < new Date()) {
          await this.saveSubscriptionStatus(false, null, null);
          return { isVip: false, subscriptionId: null, expiryDate: null };
        }

        return status;
      }
    } catch (error) {
      console.error('Failed to get local subscription status:', error);
    }

    return { isVip: false, subscriptionId: null, expiryDate: null };
  }

  async isVipUser(): Promise<boolean> {
    const status = await this.checkSubscriptionStatus();
    return status.isVip;
  }

  async getSubscriptionInfo() {
    if (!browser) return null;
    await this.loadPlugin();

    if (!this.IAP2) return null;

    try {
      const product: IAPProduct = this.IAP2.getProducts().find((p: IAPProduct) => p.id === this.vipSubscriptionSku);
      return product || null;
    } catch (error) {
      console.error('Failed to get subscription info:', error);
      return null;
    }
  }
}

export const billingService = new BillingService();
