import { db } from "./shared/dbClient.js";
import { isCorrectGuess, calculateNewStats, isGameOver, getTodayDate } from "./shared/gameLogic.js";

export const handler = async (event) => {
	// Handle CORS preflight
	if (event.requestContext?.http?.method === "OPTIONS" || event.httpMethod === "OPTIONS") {
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			},
			body: "",
		};
	}

	const body = JSON.parse(event.body);
	const { userId, guessedGolferId, guessCount, guessedGolferIds } = body;

	const date = getTodayDate();
	if (!userId || !guessedGolferId || !guessCount || !guessedGolferIds) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			},
			body: JSON.stringify({ message: "Missing required parameters" }),
		};
	}

	try {
		const dailyPuzzle = await db.getDailyPuzzle(date);
		if (!dailyPuzzle) {
			return {
				statusCode: 404,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
				},
				body: JSON.stringify({ message: "Daily puzzle not found" }),
			};
		}
		const isCorrect = isCorrectGuess(guessedGolferId, dailyPuzzle.golferId);
		const gameOver = isGameOver(guessCount, isCorrect);

		if (gameOver) {
			console.log(`Game over for user ${userId} on ${date}. Updating stats...`);
			const currentStats = await db.getUserStats(userId);
			const newStats = calculateNewStats(currentStats, isCorrect, guessCount, date);
			await db.updateUserStats(userId, newStats);
			console.log(`Updated stats for user ${userId}:`, newStats);

			await db.saveUserGame(userId, date, {
				golferId: dailyPuzzle.golferId,
				guessedGolferIds: guessedGolferIds,
				won: isCorrect,
				guesses: guessCount,
			});

			console.log(`Saved game data for user ${userId} on ${date}.`);

			await db.updatePuzzleStats(date, isCorrect);
		}

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			},
			body: JSON.stringify({
				isCorrect,
				gameOver,
				answer: gameOver
					? {
							golferId: dailyPuzzle.golferId,
							golferName: dailyPuzzle.golferName,
					  }
					: null,
			}),
		};
	} catch (error) {
		console.error("Error in submitGuess handler:", error);
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			},
			body: JSON.stringify({ message: "Internal server error" }),
		};
	}
};
