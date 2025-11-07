<script>
  import { gameState } from '../stores';
  import Menu from './Menu.svelte';
  import Playing from './Playing.svelte';
  import Paused from './Paused.svelte';
  import LevelComplete from './LevelComplete.svelte';
  import GameOver from './GameOver.svelte';
</script>

<div class="game-container">
  {#if $gameState === 'menu'}
    <Menu />
  {:else if $gameState === 'playing'}
    <Playing />
  {:else if $gameState === 'paused'}
    <Paused />
  {:else if $gameState === 'levelComplete'}
    <LevelComplete />
  {:else if $gameState === 'gameOver'}
    <GameOver />
  {/if}
</div>
