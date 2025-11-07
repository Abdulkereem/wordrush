// $lib/services/ads.ts
import { AdMob } from '@capacitor-community/admob';
import type { BannerAdOptions, InterstitialAdOptions, RewardedAdOptions } from '@capacitor-community/admob';
import { writable } from 'svelte/store';
import { billingService } from './billing';

function createAdsStore() {
	const { subscribe, set } = writable<{ shouldShowAds: boolean }>({ shouldShowAds: true });
	let isInitialized = false;
	const adIds = {
		banner: 'ca-app-pub-3940256099942544/6300978111', // Test ID
		interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test ID
		rewarded: 'ca-app-pub-3940256099942544/5224354917' // Test ID
	};

	billingService.subscribe((status) => {
		set({ shouldShowAds: !status.isVip });
	});

	async function initialize() {
		try {
			await AdMob.initialize({
				requestTrackingAuthorization: true,
				testingDevices: ['YOUR_DEVICE_ID'],
				initializeForTesting: true
			});
			isInitialized = true;
			console.log('AdMob initialized');
		} catch (error) {
			console.error('Failed to initialize AdMob:', error);
		}
	}

	async function showBannerAd() {
		if (!isInitialized) return;

		try {
			const options: BannerAdOptions = {
				adId: adIds.banner,
				adSize: 'BANNER',
				position: 'BOTTOM_CENTER',
				margin: 0,
				isTesting: true
			};
			await AdMob.showBanner(options);
		} catch (error) {
			console.error('Failed to show banner ad:', error);
		}
	}

	async function hideBannerAd() {
		try {
			await AdMob.hideBanner();
		} catch (error) {
			console.error('Failed to hide banner ad:', error);
		}
	}

	async function showInterstitialAd(): Promise<boolean> {
		if (!isInitialized) return false;

		try {
			const options: InterstitialAdOptions = {
				adId: adIds.interstitial,
				isTesting: true
			};
			await AdMob.prepareInterstitial(options);
			await AdMob.showInterstitial();
			return true;
		} catch (error) {
			console.error('Failed to show interstitial ad:', error);
			return false;
		}
	}

	async function showRewardedAd(): Promise<{ watched: boolean; rewarded: boolean }> {
		if (!isInitialized) return { watched: false, rewarded: false };

		try {
			const options: RewardedAdOptions = {
				adId: adIds.rewarded,
				isTesting: true
			};

			await AdMob.prepareRewardVideoAd(options);

			return new Promise((resolve) => {
				let resolved = false;

				const onReward = () => {
					if (!resolved) {
						resolved = true;
						resolve({ watched: true, rewarded: true });
					}
				};

				const onClose = () => {
					if (!resolved) {
						resolved = true;
						resolve({ watched: false, rewarded: false });
					}
				};

				AdMob.addListener('onRewardedVideoAdReward', onReward);
				AdMob.addListener('onRewardedVideoAdClosed', onClose);
				AdMob.addListener('onRewardedVideoAdFailedToLoad', onClose);

				AdMob.showRewardVideoAd().catch(() => {
					if (!resolved) resolve({ watched: false, rewarded: false });
				});
			});
		} catch (error) {
			console.error('Failed to show rewarded ad:', error);
			return { watched: false, rewarded: false };
		}
	}

	return {
		subscribe,
		initialize,
		showBannerAd,
		hideBannerAd,
		showInterstitialAd,
		showRewardedAd
	};
}

export const adsService = createAdsStore();
