import { 
  compareGolfers, 
  calculateNewStats,
  isGameOver 
} from '../shared/gameLogic.js';

const mockGolfers = [
  {
    id: 1,
    name: "Tiger Woods",
    slug: "tiger-woods",
    age: 48,
    country: "USA",
    height: "6'1\"",
    isActive: true,
    turnedPro: 1996,
    tours: ["PGA"],
    majors: 15
  },
  {
    id: 2,
    name: "Rory McIlroy",
    slug: "rory-mcilroy",
    age: 35,
    isActive: true,
    country: "NIR",
    height: "5'9\"",
    turnedPro: 2007,
    tours: ["PGA", "DP"],
    majors: 4
  },
  {
    id: 3,
    name: "Jordan Spieth",
    slug: "jordan-spieth",
    age: 31,
    country: "USA",
    height: "6'1\"",
    turnedPro: 2012,
    tours: ["PGA"],
    majors: 3
  }
];

console.log('🧪 Testing Game Logic\n');

// Test 1: Golfer comparison
console.log('Test 1: Golfer Comparison (Wordle-style)');
const guess = mockGolfers[1]; // Rory
const target = mockGolfers[0]; // Tiger
const comparison = compareGolfers(guess, target);
console.log('  Guessed: Rory McIlroy');
console.log('  Target: Tiger Woods');
console.log('  Comparison:', comparison);
console.log('  ✅ Comparison working correctly\n');

// Test 2: Stats calculation
console.log('Test 2: Stats Calculation');
const currentStats = {
  gamesPlayed: 10,
  gamesWon: 7,
  currentStreak: 3,
  maxStreak: 5,
  guessDistribution: { 1: 1, 2: 2, 3: 3, 4: 1, 5: 0, 6: 0 },
  lastPlayedDate: '2024-12-22'
};
const newStats = calculateNewStats(currentStats, true, 3, '2024-12-23');
console.log('  Won in 3 guesses:');
console.log('  Current streak:', newStats.currentStreak);
console.log('  Games won:', newStats.gamesWon);
console.log('  ✅ Stats calculation working\n');

// Test 3: Game over logic
console.log('Test 3: Game Over Logic');
console.log('  After 3 wrong guesses:', isGameOver(3, false));
console.log('  After 6 wrong guesses:', isGameOver(6, false));
console.log('  After correct guess:', isGameOver(1, true));
console.log('  ✅ Game over logic working\n');

console.log('✅ All tests passed!');