
export function isCorrectGuess(guessedId, targetId) {
  return guessedId === targetId;
}

export function calculateNewStats(currentStats, won, guessCount, date) {
  const isNewStreak = currentStats.lastPlayedDate 
    ? isConsecutiveDay(currentStats.lastPlayedDate, date)
    : true;

  const newStreak = won 
    ? (isNewStreak ? currentStats.currentStreak + 1 : 1)
    : 0;

  return {
    ...currentStats,
    gamesPlayed: currentStats.gamesPlayed + 1,
    gamesWon: won ? currentStats.gamesWon + 1 : currentStats.gamesWon,
    currentStreak: newStreak,
    maxStreak: Math.max(currentStats.maxStreak, newStreak),
    guessDistribution: {
      ...currentStats.guessDistribution,
      [guessCount]: (currentStats.guessDistribution[guessCount] || 0) + (won ? 1 : 0)
    },
    lastPlayedDate: date
  };
}

export function isConsecutiveDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export function compareGolfers(guessedGolfer, targetGolfer) {
  return {
    age: compareNumbers(guessedGolfer.age, targetGolfer.age, 2),
    country: compareExact(guessedGolfer.country, targetGolfer.country),
    height: compareExact(guessedGolfer.height, targetGolfer.height),
    turnedPro: compareNumbers(guessedGolfer.turnedPro, targetGolfer.turnedPro, 3),
    education: compareExact(guessedGolfer.education, targetGolfer.education),
    isActive: compareExact(guessedGolfer.isActive, targetGolfer.isActive),
  };
}

function compareNumbers(guessedValue, targetValue, closeThreshold = 2) {
  if (!guessedValue || !targetValue) return 'none';
  if (guessedValue === targetValue) return 'exact';
  const diff = Math.abs(guessedValue - targetValue);
  if (diff <= closeThreshold) return 'close';
  return guessedValue < targetValue ? 'higher' : 'lower';
}

function compareExact(guessedValue, targetValue) {
  if (!guessedValue || !targetValue) return 'none';
  return guessedValue === targetValue ? 'exact' : 'none';
}

export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export function isGameOver(guessCount, isCorrect) {
  return isCorrect || guessCount >= 6;
}

export async function fetchGolfers(s3Url) {
  try {
    const response = await fetch(s3Url);
    if (!response.ok) {
      throw new Error(`Failed to fetch golfers: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching golfers:', error);
    throw error;
  }
}