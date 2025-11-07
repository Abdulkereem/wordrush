<script>
  import { gameState, currentLevel, score, lives, timeLeft, foundWords, targetWords } from '../stores';
  import { onMount, onDestroy } from 'svelte';
  import levels from '../levels.json';

  let currentWord = '';
  let grid = [];

  onMount(() => {
    startLevel($currentLevel);
  });

  function startLevel(level) {
    const levelData = levels[level - 1];
    grid = levelData.grid;
    targetWords.set([...levelData.words]);
    foundWords.set([]);
    timeLeft.set(levelData.time);
    currentWord = '';
    lives.set(3);

    startTimer();
  }

  function addLetter(letter) {
    currentWord += letter;
  }

  function backspace() {
    currentWord = currentWord.slice(0, -1);
  }

  function submitWord() {
    const word = currentWord.toUpperCase();
    if ($targetWords.includes(word) && !$foundWords.includes(word)) {
      foundWords.update(fw => [...fw, word]);
      const levelData = levels[$currentLevel - 1];
      const points = word.length * levelData.pointsPerWord;
      score.update(s => s + points);

      if ($foundWords.length === $targetWords.length) {
        gameState.set('levelComplete');
      }
    }
    currentWord = '';
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function startTimer() {
    const timer = setInterval(() => {
      timeLeft.update(t => {
        if (t > 0) {
          return t - 1;
        } else {
          clearInterval(timer);
          gameState.set('gameOver');
          return 0;
        }
      });
    }, 1000);

    onDestroy(() => {
      clearInterval(timer);
    });
  }
</script>

<div class="game-screen">
  <!-- HUD -->
  <div class="hud">
    <button class="hud-btn" on:click={() => gameState.set('paused')}>
      <i class="icon">⏸</i>
    </button>
    <div class="hud-center">
      <div class="hud-item">Level {$currentLevel}</div>
      <div class="hud-item timer">⏱ {formatTime($timeLeft)}</div>
    </div>
    <button class="hud-btn" on:click={() => { /* toggle tips */ }}>
      <i class="icon">💡</i>
    </button>
  </div>

  <!-- Game Grid -->
  <div class="word-grid">
    {#each grid as row}
      <div class="grid-row">
        {#each row as letter}
          <button class="grid-letter" on:click={() => addLetter(letter)}>{letter}</button>
        {/each}
      </div>
    {/each}
  </div>

  <!-- Word Submission -->
  <div class="word-submission">
    <div class="current-word">{currentWord}</div>
    <div class="submission-btns">
      <button class="submit-btn" on:click={backspace}>
        <i class="icon">⌫</i>
      </button>
      <button class="submit-btn primary" on:click={submitWord}>Submit</button>
    </div>
  </div>
</div>
