<script>
  import { gameState, currentLevel, score, lives, foundWords, targetWords } from '../stores';

  function nextLevel() {
    gameState.set('playing');
    currentLevel.update(l => l + 1);
  }

  function backToMenu() {
    gameState.set('menu');
  }
</script>

<div class="level-complete-screen">
  <h2>Level {$currentLevel} Complete!</h2>
  <div class="complete-stats">
    <div class="stat">Words Found: {$foundWords.length}/{$targetWords.length}</div>
    <div class="stat">Score: {$score}</div>
    <div class="stat">Lives Remaining: {$lives}</div>
  </div>
  <div class="complete-buttons">
    <button class="menu-btn primary" on:click={nextLevel}>Next Level</button>
    <button class="menu-btn" on:click={backToMenu}>Main Menu</button>
  </div>
</div>
