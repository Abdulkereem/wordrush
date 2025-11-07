// $lib/services/googlePlay.ts
import { Preferences } from '@capacitor/preferences';
import { GoogleGameServices } from 'capacitor-google-game-services';

export interface GameUser {
  playerId: string;
  displayName: string;
  avatarUrl: string;
  isSignedIn: boolean;
}

class GooglePlayService {
  private user: GameUser | null = null;

  async initialize() {
    try {
      const { isAuthenticated } = await GoogleGameServices.isAuthenticated();
      if (isAuthenticated) {
        await this.loadUser();
      } else {
        console.log('Not authenticated yet, will need manual sign-in');
      }
    } catch (err) {
      console.warn('Google Play Games not available:', err);
    }
  }

  async signIn(): Promise<GameUser | null> {
    try {
      const { isAuthenticated } = await GoogleGameServices.signIn();
      if (isAuthenticated) {
        const { player } = await GoogleGameServices.getCurrentPlayer();
        this.user = {
          playerId: player.playerId,
          displayName: player.displayName,
          avatarUrl: player.iconImageUrl || '',
          isSignedIn: true
        };

        await Preferences.set({
          key: 'game_user',
          value: JSON.stringify(this.user)
        });
        return this.user;
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    }
    return null;
  }

  async signOut() {
    try {
      await GoogleGameServices.signOut?.();
    } catch (err) {
      console.warn('SignOut not supported by this plugin');
    }
    this.user = null;
    await Preferences.remove({ key: 'game_user' });
  }

  async loadUser(): Promise<GameUser | null> {
    try {
      const { value } = await Preferences.get({ key: 'game_user' });
      if (value) {
        this.user = JSON.parse(value);
        return this.user;
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
    return null;
  }

  getCurrentUser(): GameUser | null {
    return this.user;
  }

  isUserSignedIn(): boolean {
    return this.user?.isSignedIn || false;
  }
}

export const googlePlayService = new GooglePlayService();
