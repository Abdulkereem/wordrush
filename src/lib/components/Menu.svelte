<script lang="ts">
  import { onMount } from 'svelte';
  import { googlePlayService, type GameUser } from '$lib/services/googlePlay';
  import { billingService, type SubscriptionStatus } from '$lib/services/billing';
  import { adsService } from '$lib/services/ads';

  export let onStart: () => void;
  export let onHowToPlay: () => void;

  let user: GameUser | null = null;
  let subscriptionStatus: SubscriptionStatus = {
    isVip: false,
    subscriptionId: null,
    expiryDate: null
  };
  let showSubscriptionModal = false;

  onMount(async () => {
    // Initialize services
    await googlePlayService.initialize();
    await billingService.initialize();
    await adsService.initialize();

    // Try auto-login / restore session
    user = await googlePlayService.loadUser();
    
    if (user?.isSignedIn) {
      subscriptionStatus = await billingService.checkSubscriptionStatus();
      if (!subscriptionStatus.isVip) await adsService.showBannerAd();
    }
  });

  async function handleSignIn() {
    console.log('clicked')
    user = await googlePlayService.signIn();
    if (user) {
      subscriptionStatus = await billingService.checkSubscriptionStatus();
      if (subscriptionStatus.isVip) await adsService.hideBannerAd();
    }
  }

  async function handleSignOut() {
    await googlePlayService.signOut();
    await adsService.hideBannerAd();
    user = null;
    subscriptionStatus = { isVip: false, subscriptionId: null, expiryDate: null };
    await adsService.showBannerAd();
  }

  async function handleSubscribe() {
    const success = await billingService.purchaseVipSubscription();
    if (success) {
      subscriptionStatus = await billingService.checkSubscriptionStatus();
      await adsService.hideBannerAd();
      showSubscriptionModal = false;
    }
  }

  function openSubscriptionModal() { showSubscriptionModal = true; }
  function closeSubscriptionModal() { showSubscriptionModal = false; }
</script>

<div class="menu-screen">
  <div class="menu-content">
    <!-- User Section -->
    <div class="user-section">
      {#if user?.isSignedIn}
        <div class="user-profile">
          {#if user.avatarUrl}
            <img src={user.avatarUrl} alt="Profile" class="avatar" />
          {/if}
          <div class="user-info">
            <div class="user-name">{user.displayName}</div>
            {#if subscriptionStatus.isVip}
              <div class="vip-badge">👑 VIP Member</div>
            {/if}
          </div>
          <button class="sign-out-btn" on:click={handleSignOut}>
            <i class="fa fa-sign-out-alt"></i>
          </button>
        </div>
      {:else}
        <button class="sign-in-btn" on:click={handleSignIn}>
          <i class="fab fa-google"></i> Sign in with Google
        </button>
      {/if}
    </div>

    <!-- Logo and Title -->
    <img src="/logo.png" alt="WordRush Logo" class="logo" />
    <h1 class="title">WordRush</h1>
    <p class="tagline">Race against time. Form words. Beat the rush!</p>

    <!-- VIP Subscription Offer -->
    {#if user?.isSignedIn && !subscriptionStatus.isVip}
      <div class="subscription-offer">
        <div class="offer-text">
          <i class="fa fa-crown"></i> Upgrade to VIP
        </div>
        <div class="offer-benefits">
          • No ads • Always get tips • Premium support
        </div>
        <button class="upgrade-btn" on:click={openSubscriptionModal}>
          $3/week - Try VIP
        </button>
      </div>
    {/if}

    <!-- Main Buttons -->
    <div class="buttons">
      <button class="btn start" on:click={onStart}>
        <i class="fa fa-play"></i> Start Game
      </button>
      <button class="btn howto" on:click={onHowToPlay}>
        <i class="fa fa-question-circle"></i> How to Play
      </button>
    </div>
  </div>
</div>

<!-- Subscription Modal -->
{#if showSubscriptionModal}
  <div class="modal-overlay" on:click={closeSubscriptionModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>👑 Upgrade to VIP</h2>
        <button class="close-btn" on:click={closeSubscriptionModal}>×</button>
      </div>
      <div class="modal-content">
        <div class="vip-benefits">
          <div class="benefit"><i class="fa fa-ban"></i>No Ads Ever</div>
          <div class="benefit"><i class="fa fa-lightbulb"></i>Always Get Tips</div>
          <div class="benefit"><i class="fa fa-crown"></i>VIP Status</div>
          <div class="benefit"><i class="fa fa-headset"></i>Premium Support</div>
        </div>
        <div class="price-info">
          <div class="price">$3.00 USD</div>
          <div class="period">per week</div>
        </div>
        <button class="subscribe-btn" on:click={handleSubscribe}>
          Subscribe Now
        </button>
        <div class="terms">
          <small>Auto-renews weekly. Cancel anytime in Google Play. By subscribing, you agree to our Terms of Service.</small>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .menu-screen { display:flex; justify-content:center; align-items:center; width:100vw; height:100vh; background:linear-gradient(160deg,var(--primary),var(--secondary)); color:white; padding-bottom:60px; }
  .menu-content { display:flex; flex-direction:column; align-items:center; text-align:center; gap:1.5rem; padding:2rem; max-width:400px; width:100%; }
  .user-section { width:100%; margin-bottom:1rem; }
  .user-profile { display:flex; align-items:center; gap:1rem; background:rgba(255,255,255,0.1); padding:1rem; border-radius:12px; backdrop-filter:blur(10px); }
  .avatar { width:50px; height:50px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); }
  .user-info { flex:1; text-align:left; }
  .user-name { font-weight:600; font-size:1.1rem; }
  .vip-badge { font-size:0.8rem; color:#FFD700; font-weight:500; }
  .sign-in-btn, .sign-out-btn { background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3); color:white; border-radius:8px; padding:0.5rem 1rem; cursor:pointer; font-weight:500; }
  .sign-in-btn { width:100%; padding:1rem; font-size:1rem; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
  .sign-out-btn { padding:0.5rem; }
  .subscription-offer { background:linear-gradient(135deg,#FFD700,#FFA500); color:#333; padding:1rem; border-radius:12px; width:100%; margin:0.5rem 0; }
  .offer-text { font-size:1.1rem; font-weight:bold; margin-bottom:0.5rem; }
  .offer-benefits { font-size:0.9rem; margin-bottom:0.8rem; opacity:0.8; }
  .upgrade-btn { background:#333; color:white; border:none; padding:0.8rem 1.5rem; border-radius:8px; font-weight:bold; cursor:pointer; width:100%; }
  .logo { width:120px; margin-bottom:0.5rem; }
  .title { font-size:2.5rem; font-weight:800; letter-spacing:1px; text-shadow:0 2px 6px rgba(0,0,0,0.3); }
  .tagline { font-size:1rem; font-weight:500; opacity:0.9; margin-bottom:1.5rem; }
  .buttons { display:flex; flex-direction:column; gap:1rem; width:100%; }
  .btn { width:100%; padding:1rem; font-size:1.1rem; font-weight:600; border:none; border-radius:12px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:0.6rem; transition:transform 0.1s ease, opacity 0.2s ease; }
  .btn:active { transform:scale(0.97); opacity:0.85; }
  .start { background:#16a34a; color:white; }
  .howto { background:#facc15; color:#222; }
  .modal-overlay { position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index:1000; }
  .modal { background:white; color:#333; max-width:400px; width:90vw; border-radius:16px; overflow:hidden; }
  .modal-header { background:linear-gradient(135deg,#FFD700,#FFA500); padding:1.5rem; display:flex; justify-content:space-between; align-items:center; }
  .modal-header h2 { margin:0; font-size:1.5rem; }
  .close-btn { background:none; border:none; font-size:2rem; cursor:pointer; padding:0; width:30px; height:30px; }
  .modal-content { padding:2rem; }
  .vip-benefits { margin-bottom:2rem; }
  .benefit { display:flex; align-items:center; gap:0.8rem; margin-bottom:1rem; font-size:1rem; }
  .benefit i { color:#16a34a; width:20px; }
  .price-info { text-align:center; margin-bottom:1.5rem; }
  .price { font-size:2rem; font-weight:bold; color:#16a34a; }
  .period { color:#666; }
  .subscribe-btn { width:100%; background:#16a34a; color:white; border:none; padding:1rem; font-size:1.1rem; font-weight:bold; border-radius:8px; cursor:pointer; margin-bottom:1rem; }
  .terms { text-align:center; color:#666; line-height:1.4; }
</style>
