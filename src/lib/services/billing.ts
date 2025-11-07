// $lib/services/billing.ts
import { browser } from '$app/environment';
import type { IAPProduct } from '@awesome-cordova-plugins/in-app-purchase-2';
import { Preferences } from '@capacitor/preferences';
import { writable } from 'svelte/store';

export interface SubscriptionStatus {
	isVip: boolean;
	subscriptionId: string | null;
	expiryDate: Date | null;
}

function createBillingStore() {
	const { subscribe, set } = writable<SubscriptionStatus>({
		isVip: false,
		subscriptionId: null,
		expiryDate: null
	});
	let IAP2: any = null;
	const vipSubscriptionSku = 'wordrush_vip_weekly';
	let isInitialized = false;

	async function loadPlugin() {
		if (!IAP2 && browser) {
			const module = await import('@awesome-cordova-plugins/in-app-purchase-2');
			IAP2 = module;
		}
	}

	async function initialize() {
		try {
			if (!browser) return; // skip SSR
			await loadPlugin();

			if (!isInitialized && IAP2) {
				IAP2.register({
					id: vipSubscriptionSku,
					type: IAP2.CONSUMABLE // or SUBSCRIPTION if you prefer
				});

				IAP2.when(vipSubscriptionSku).approved(async (product: IAPProduct) => {
					await IAP2.finish(product);
					await saveSubscriptionStatus(
						true,
						product.transaction?.id ?? null,
						product.expirationDate
							? new Date(product.expirationDate)
							: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
					);
				});

				IAP2.refresh();
				isInitialized = true;
				console.log('Billing service initialized');
				await checkSubscriptionStatus();
			}
		} catch (error) {
			console.error('Failed to initialize billing:', error);
		}
	}

	async function purchaseVipSubscription(): Promise<boolean> {
		if (!browser || !IAP2) return false;

		try {
			const product: IAPProduct = await IAP2.order(vipSubscriptionSku);
			if (product.owned || product.transaction) {
				await saveSubscriptionStatus(
					true,
					product.transaction?.id ?? null,
					product.expirationDate
						? new Date(product.expirationDate)
						: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
				);
				return true;
			}
		} catch (error) {
			console.error('Purchase failed:', error);
		}
		return false;
	}

	async function checkSubscriptionStatus(): Promise<SubscriptionStatus> {
		if (!browser) return await getLocalSubscriptionStatus();
		if (!IAP2) return await getLocalSubscriptionStatus();

		try {
			const product: IAPProduct = IAP2.getProducts().find((p: IAPProduct) => p.id === vipSubscriptionSku);

			if (product?.owned) {
				const status: SubscriptionStatus = {
					isVip: true,
					subscriptionId: product.transaction?.id || null,
					expiryDate: product.expirationDate
						? new Date(product.expirationDate)
						: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
				};
				await saveSubscriptionStatus(status.isVip, status.subscriptionId, status.expiryDate);
				return status;
			}

			await saveSubscriptionStatus(false, null, null);
			return { isVip: false, subscriptionId: null, expiryDate: null };
		} catch (error) {
			console.error('Failed to check subscription:', error);
			return await getLocalSubscriptionStatus();
		}
	}

	async function saveSubscriptionStatus(isVip: boolean, subscriptionId: string | null, expiryDate: Date | null) {
		const status: SubscriptionStatus = { isVip, subscriptionId, expiryDate };
		await Preferences.set({ key: 'subscription_status', value: JSON.stringify(status) });
		set(status);
	}

	async function getLocalSubscriptionStatus(): Promise<SubscriptionStatus> {
		try {
			const { value } = await Preferences.get({ key: 'subscription_status' });
			if (value) {
				const status: SubscriptionStatus = JSON.parse(value);

				if (status.expiryDate && new Date(status.expiryDate) < new Date()) {
					await saveSubscriptionStatus(false, null, null);
					return { isVip: false, subscriptionId: null, expiryDate: null };
				}
				set(status);
				return status;
			}
		} catch (error) {
			console.error('Failed to get local subscription status:', error);
		}

		const defaultStatus = { isVip: false, subscriptionId: null, expiryDate: null };
		set(defaultStatus);
		return defaultStatus;
	}

	async function getSubscriptionInfo() {
		if (!browser || !IAP2) return null;
		try {
			return IAP2.getProducts().find((p: IAPProduct) => p.id === vipSubscriptionSku) || null;
		} catch (error) {
			console.error('Failed to get subscription info:', error);
			return null;
		}
	}

	// Load the initial status from local storage
	if (browser) {
		getLocalSubscriptionStatus();
	}

	return {
		subscribe,
		initialize,
		purchaseVipSubscription,
		checkSubscriptionStatus,
		getSubscriptionInfo
	};
}

export const billingService = createBillingStore();
