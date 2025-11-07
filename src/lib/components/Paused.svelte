<script>
  import { gameState } from '../stores';

  function resumeGame() {
    gameState.set('playing');
  }

  function backToMenu() {
    gameState.set('menu');
  }
</script>

<div class="pause-screen">
  <h2>Game Paused</h2>
  <div class="pause-buttons">
    <button class="menu-btn primary" on:click={resumeGame}>Resume</button>
    <button class="menu-btn" on:click={backToMenu}>Main Menu</button>
  </div>
</div>
