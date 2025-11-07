<script>
  import { gameState, currentLevel, highScore } from '../stores';
  import { googlePlayService } from '../services/googlePlay';

  function startGame() {
    gameState.set('playing');
  }

  function restartGame() {
    currentLevel.set(1);
    highScore.set(0);
    gameState.set('playing');
  }

  function showLeaderboard() {
    // Implement leaderboard logic using googlePlayService
  }
</script>

<div class="menu-screen">
  <h1 class="game-title">WordRush</h1>
  <div class="menu-stats">
    <div class="stat">Level: {$currentLevel}</div>
    <div class="stat">High Score: {$highScore}</div>
  </div>
  <div class="menu-buttons">
    <button class="menu-btn primary" on:click={startGame}>Start Game</button>
    <button class="menu-btn" on:click={restartGame}>New Game</button>
    <button class="menu-btn" on:click={showLeaderboard}>Leaderboard</button>
  </div>
</div>
