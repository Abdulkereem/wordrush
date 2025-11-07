import { writable } from 'svelte/store';

export const gameState = writable('menu'); // menu, playing, paused, gameOver, levelComplete
export const currentLevel = writable(1);
export const score = writable(0);
export const highScore = writable(0);
export const lives = writable(3);
export const timeLeft = writable(60);
export const foundWords = writable([]);
export const targetWords = writable([]);
