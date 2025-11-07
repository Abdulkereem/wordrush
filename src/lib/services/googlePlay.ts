// $lib/services/googlePlay.ts
import { writable } from 'svelte/store';
import { Preferences } from '@capacitor/preferences';
import { GoogleGameServices } from 'capacitor-google-game-services';

export interface GameUser {
	playerId: string;
	displayName: string;
	avatarUrl: string;
	isSignedIn: boolean;
}

function createGooglePlayStore() {
	const { subscribe, set, update } = writable<GameUser | null>(null);

	async function initialize() {
		try {
			const { isAuthenticated } = await GoogleGameServices.isAuthenticated();
			if (isAuthenticated) {
				await loadUser();
			} else {
				console.log('Not authenticated yet, will need manual sign-in');
			}
		} catch (err) {
			console.warn('Google Play Games not available:', err);
		}
	}

	async function signIn(): Promise<GameUser | null> {
		try {
			const result = await GoogleGameServices.signIn();
			if (result.isAuthenticated) {
				const { player } = await GoogleGameServices.getCurrentPlayer();
				const user: GameUser = {
					playerId: player.playerId,
					displayName: player.displayName,
					avatarUrl: player.iconImageUrl || '',
					isSignedIn: true
				};

				await Preferences.set({
					key: 'game_user',
					value: JSON.stringify(user)
				});
				set(user);
				return user;
			}
		} catch (error) {
			console.error('Sign in failed:', error);
		}
		return null;
	}

	async function signOut() {
		try {
			await GoogleGameServices.signOut?.();
		} catch (err) {
			console.warn('SignOut not supported by this plugin');
		}
		set(null);
		await Preferences.remove({ key: 'game_user' });
	}

	async function loadUser(): Promise<GameUser | null> {
		try {
			const { value } = await Preferences.get({ key: 'game_user' });
			if (value) {
				const user = JSON.parse(value);
				set(user);
				return user;
			}
		} catch (error) {
			console.error('Failed to load user:', error);
		}
		return null;
	}

	return {
		subscribe,
		initialize,
		signIn,
		signOut,
		loadUser
	};
}

export const googlePlayService = createGooglePlayStore();
