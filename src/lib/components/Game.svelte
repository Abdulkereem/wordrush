<script>
  import { onMount, onDestroy } from "svelte";

  // Game states
  let gameState = "menu"; // menu, playing, paused, gameOver, levelComplete
  let currentLevel = 1;
  let score = 0;
  let highScore = 0;
  let lives = 3;
  let timeLeft = 60;
  let currentWord = "";
  let foundWords = [];
  let targetWords = [];
  let showTips = false;
  let showHelp = false;
  
  let timer = null;
  let grid = [];

  // Level configurations
  const levels = [
    {
      level: 1,
      grid: [
        ['C', 'A', 'T', 'S'],
        ['R', 'U', 'N', 'O'],
        ['A', 'T', 'E', 'G'],
        ['B', 'O', 'X', 'Y']
      ],
      words: ['CAT', 'RUN', 'ATE', 'BOX', 'CATS', 'CRAB', 'TON', 'GOT'],
      time: 90,
      pointsPerWord: 10
    },
    {
      level: 2,
      grid: [
        ['F', 'L', 'O', 'W'],
        ['I', 'R', 'E', 'D'],
        ['S', 'H', 'A', 'R'],
        ['T', 'E', 'S', 'T']
      ],
      words: ['FLOW', 'FIRE', 'SHED', 'TEST', 'SHARE', 'FISH', 'RED', 'HAT', 'ART'],
      time: 80,
      pointsPerWord: 15
    },
    {
      level: 3,
      grid: [
        ['S', 'P', 'A', 'C'],
        ['T', 'A', 'R', 'E'],
        ['O', 'R', 'M', 'S'],
        ['N', 'E', 'W', 'D']
      ],
      words: ['SPACE', 'STAR', 'STORM', 'NEW', 'CARE', 'ORMS', 'CAR', 'ARE', 'WED', 'TRACED'],
      time: 70,
      pointsPerWord: 20
    }
  ];

  // Load game data from localStorage
  onMount(() => {
    loadGameData();
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  function loadGameData() {
    const saved = localStorage.getItem("wordrush_data");
    if (saved) {
      const data = JSON.parse(saved);
      highScore = data.highScore || 0;
      currentLevel = data.currentLevel || 1;
    }
  }

  function saveGameData() {
    const data = {
      highScore,
      currentLevel,
      timestamp: Date.now()
    };
    localStorage.setItem("wordrush_data", JSON.stringify(data));
  }

  function startLevel(level) {
    if (level > levels.length) {
      gameState = "gameOver";
      return;
    }

    const levelData = levels[level - 1];
    grid = levelData.grid;
    targetWords = [...levelData.words];
    foundWords = [];
    timeLeft = levelData.time;
    currentWord = "";
    lives = 3;
    gameState = "playing";

    startTimer();
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        loseLife();
      }
    }, 1000);
  }

  function pauseGame() {
    if (timer) clearInterval(timer);
    gameState = "paused";
  }

  function resumeGame() {
    gameState = "playing";
    startTimer();
  }

  function loseLife() {
    if (timer) clearInterval(timer);
    lives--;
    if (lives <= 0) {
      gameOver();
    } else {
      // Reset timer but keep progress
      const levelData = levels[currentLevel - 1];
      timeLeft = levelData.time;
      startTimer();
    }
  }

  function gameOver() {
    if (timer) clearInterval(timer);
    if (score > highScore) {
      highScore = score;
      saveGameData();
    }
    gameState = "gameOver";
  }

  function nextLevel() {
    currentLevel++;
    if (currentLevel > levels.length) {
      gameState = "gameOver";
      return;
    }
    saveGameData();
    startLevel(currentLevel);
  }

  function restartGame() {
    score = 0;
    currentLevel = 1;
    startLevel(1);
  }

  function backToMenu() {
    if (timer) clearInterval(timer);
    gameState = "menu";
    currentWord = "";
  }

  function addLetter(letter) {
    if (gameState !== "playing") return;
    currentWord += letter;
  }

  function backspace() {
    if (gameState !== "playing") return;
    currentWord = currentWord.slice(0, -1);
  }

  function submitWord() {
    if (gameState !== "playing" || currentWord.length < 2) return;

    const word = currentWord.toUpperCase();
    
    if (targetWords.includes(word) && !foundWords.includes(word)) {
      foundWords = [...foundWords, word];
      const levelData = levels[currentLevel - 1];
      const points = word.length * levelData.pointsPerWord;
      score += points;

      // Check if level complete
      if (foundWords.length === targetWords.length) {
        if (timer) clearInterval(timer);
        gameState = "levelComplete";
      }
    }

    currentWord = "";
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function toggleTips() {
    showTips = !showTips;
  }

  function toggleHelp() {
    showHelp = !showHelp;
  }

  const keyboardRows = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    "ZXCVBNM".split("")
  ];
</script>

<div class="game-container">
  {#if gameState === "menu"}
    <div class="menu-screen">
      <h1 class="game-title">WordRush</h1>
      <div class="menu-stats">
        <div class="stat">Level: {currentLevel}</div>
        <div class="stat">High Score: {highScore}</div>
      </div>
      <div class="menu-buttons">
        <button class="menu-btn primary" on:click={() => startLevel(currentLevel)}>
          Start Game
        </button>
        <button class="menu-btn" on:click={() => restartGame()}>
          New Game
        </button>
        <button class="menu-btn" on:click={toggleHelp}>
          Help
        </button>
      </div>
    </div>

  {:else if gameState === "playing"}
    <div class="game-screen">
      <!-- HUD -->
      <div class="hud">
        <button class="hud-btn" on:click={pauseGame}>
          <i class="icon">⏸</i>
        </button>
        <div class="hud-center">
          <div class="hud-item">Level {currentLevel}</div>
          <div class="hud-item timer">⏱ {formatTime(timeLeft)}</div>
        </div>
        <button class="hud-btn" on:click={toggleTips}>
          <i class="icon">💡</i>
        </button>
      </div>

      <div class="stats-bar">
        <div class="stat-item">Score: {score}</div>
        <div class="stat-item">Lives: {'❤️'.repeat(lives)}</div>
        <div class="stat-item">Found: {foundWords.length}/{targetWords.length}</div>
      </div>

      <!-- Grid -->
      <div class="grid">
        {#each grid as row}
          <div class="grid-row">
            {#each row as cell}
              <div class="grid-cell" on:click={() => addLetter(cell)}>
                {cell}
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <!-- Current Word -->
      <div class="current-word">
        <span>{currentWord || "Tap letters to form a word..."}</span>
      </div>

      <!-- Found Words -->
      <div class="found-words">
        {#each foundWords as word}
          <span class="found-word">{word}</span>
        {/each}
      </div>

      <!-- Keyboard -->
      <div class="keyboard">
        {#each keyboardRows as row}
          <div class="key-row">
            {#each row as key}
              <button class="key" on:click={() => addLetter(key)}>{key}</button>
            {/each}
          </div>
        {/each}

        <div class="key-row">
          <button class="key action" on:click={backspace}>⌫</button>
          <button class="key action submit" on:click={submitWord}>✓</button>
        </div>
      </div>
    </div>

  {:else if gameState === "paused"}
    <div class="pause-screen">
      <h2>Game Paused</h2>
      <div class="pause-buttons">
        <button class="menu-btn primary" on:click={resumeGame}>Resume</button>
        <button class="menu-btn" on:click={backToMenu}>Main Menu</button>
      </div>
    </div>

  {:else if gameState === "levelComplete"}
    <div class="level-complete-screen">
      <h2>Level {currentLevel} Complete!</h2>
      <div class="complete-stats">
        <div class="stat">Words Found: {foundWords.length}/{targetWords.length}</div>
        <div class="stat">Score: {score}</div>
        <div class="stat">Lives Remaining: {lives}</div>
      </div>
      <div class="complete-buttons">
        <button class="menu-btn primary" on:click={nextLevel}>
          Next Level
        </button>
        <button class="menu-btn" on:click={backToMenu}>Main Menu</button>
      </div>
    </div>

  {:else if gameState === "gameOver"}
    <div class="game-over-screen">
      <h2>Game Over</h2>
      <div class="final-stats">
        <div class="stat">Final Score: {score}</div>
        <div class="stat">High Score: {highScore}</div>
        <div class="stat">Level Reached: {currentLevel}</div>
      </div>
      <div class="game-over-buttons">
        <button class="menu-btn primary" on:click={restartGame}>Play Again</button>
        <button class="menu-btn" on:click={backToMenu}>Main Menu</button>
      </div>
    </div>
  {/if}

  <!-- Tips Modal -->
  {#if showTips}
    <div class="modal-overlay" on:click={toggleTips}>
      <div class="modal" on:click|stopPropagation>
        <h3>Tips</h3>
        <ul class="tips-list">
          <li>Look for words in all directions</li>
          <li>Start with short words (3-4 letters)</li>
          <li>Common patterns: -ING, -ED, -ER</li>
          <li>Don't forget plural forms</li>
          <li>Time management is key!</li>
        </ul>
        <button class="modal-btn" on:click={toggleTips}>Close</button>
      </div>
    </div>
  {/if}

  <!-- Help Modal -->
  {#if showHelp}
    <div class="modal-overlay" on:click={toggleHelp}>
      <div class="modal" on:click|stopPropagation>
        <h3>How to Play</h3>
        <div class="help-content">
          <p><strong>Objective:</strong> Find all hidden words in the grid before time runs out!</p>
          <p><strong>Controls:</strong> Tap letters on the grid or use the keyboard to form words.</p>
          <p><strong>Lives:</strong> You have 3 lives. Lose one when time runs out.</p>
          <p><strong>Scoring:</strong> Longer words = more points!</p>
          <p><strong>Levels:</strong> Each level has more challenging words and less time.</p>
        </div>
        <button class="modal-btn" on:click={toggleHelp}>Close</button>
      </div>
    </div>
  {/if}
</div>

<style>
  * {
    box-sizing: border-box;
  }

  .game-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  /* Menu Screen */
  .menu-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 2rem;
    color: white;
  }

  .game-title {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 2rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  }

  .menu-stats {
    display: flex;
    gap: 2rem;
    margin-bottom: 3rem;
    font-size: 1.2rem;
  }

  .menu-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 300px;
  }

  .menu-btn {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: bold;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255,255,255,0.2);
    color: white;
    border: 2px solid rgba(255,255,255,0.3);
  }

  .menu-btn.primary {
    background: #4CAF50;
    border-color: #4CAF50;
  }

  .menu-btn:active {
    transform: scale(0.98);
  }

  /* Game Screen */
  .game-screen {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 1rem;
    color: white;
  }

  .hud {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .hud-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .hud-item {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .timer {
    color: #FFD700;
  }

  .hud-btn {
    background: rgba(255,255,255,0.2);
    border: none;
    border-radius: 8px;
    color: white;
    padding: 0.5rem;
    cursor: pointer;
    font-size: 1.2rem;
  }

  .stats-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    font-weight: bold;
  }

  .grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-self: center;
    margin: 1rem 0;
  }

  .grid-row {
    display: flex;
    gap: 0.4rem;
  }

  .grid-cell {
    width: 60px;
    height: 60px;
    background: white;
    color: #333;
    font-size: 1.4rem;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 3px 6px rgba(0,0,0,0.2);
    transition: transform 0.1s ease;
  }

  .grid-cell:active {
    transform: scale(0.9);
  }

  .current-word {
    text-align: center;
    font-size: 1.3rem;
    font-weight: bold;
    margin: 1rem 0;
    background: rgba(255,255,255,0.15);
    padding: 0.8rem;
    border-radius: 10px;
    min-height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .found-words {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin: 1rem 0;
    min-height: 2rem;
  }

  .found-word {
    background: #4CAF50;
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: bold;
  }

  .keyboard {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .key-row {
    display: flex;
    justify-content: center;
    gap: 0.3rem;
  }

  .key {
    flex: 1;
    max-width: 35px;
    padding: 0.6rem 0.4rem;
    font-size: 0.9rem;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    background: white;
    color: #333;
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .key:active {
    transform: scale(0.95);
    background: #f0f0f0;
  }

  .key.action {
    flex: 2;
    max-width: 80px;
    background: #FF9800;
    color: white;
  }

  .key.action.submit {
    background: #4CAF50;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    padding: 2rem;
    border-radius: 15px;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    color: #333;
  }

  .modal h3 {
    margin-top: 0;
    color: #667eea;
  }

  .tips-list {
    padding-left: 1.2rem;
    margin: 1rem 0;
  }

  .tips-list li {
    margin: 0.5rem 0;
    line-height: 1.4;
  }

  .help-content {
    line-height: 1.6;
  }

  .help-content p {
    margin: 1rem 0;
  }

  .modal-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.8rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    width: 100%;
    margin-top: 1rem;
  }

  /* Other Screen Styles */
  .pause-screen, .level-complete-screen, .game-over-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 2rem;
    color: white;
    text-align: center;
  }

  .pause-buttons, .complete-buttons, .game-over-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
    width: 100%;
    max-width: 300px;
  }

  .complete-stats, .final-stats {
    margin: 2rem 0;
  }

  .stat {
    margin: 0.8rem 0;
    font-size: 1.2rem;
  }

  @media (max-width: 480px) {
    .grid-cell {
      width: 55px;
      height: 55px;
      font-size: 1.4rem;
    }

    .action-btn {
      padding: 0.8rem 1.5rem;
      font-size: 1rem;
    }

    .hud-item {
      font-size: 1rem;
    }
  }
</style>