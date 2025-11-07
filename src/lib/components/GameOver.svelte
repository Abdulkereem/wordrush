<script>
  import { gameState, score, highScore, currentLevel, lives } from '../stores';

  function restartGame() {
    gameState.set('playing');
    score.set(0);
    currentLevel.set(1);
    lives.set(3);
  }

  function backToMenu() {
    gameState.set('menu');
  }
</script>

<div class="game-over-screen">
  <h2>Game Over</h2>
  <div class="final-stats">
    <div class="stat">Final Score: {$score}</div>
    <div class="stat">High Score: {$highScore}</div>
    <div class="stat">Level Reached: {$currentLevel}</div>
  </div>
  <div class="game-over-buttons">
    <button class="menu-btn primary" on:click={restartGame}>Play Again</button>
    <button class="menu-btn" on:click={backToMenu}>Main Menu</button>
  </div>
</div>
