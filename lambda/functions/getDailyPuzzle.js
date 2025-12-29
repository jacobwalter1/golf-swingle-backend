import { db } from "./shared/dbClient.js";
import { getTodayDate, fetchGolfers } from "./shared/gameLogic.js";

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

	const date = getTodayDate();
	console.log(`Fetching daily puzzle for date: ${date}`);

	try {
		let dailyPuzzle = await db.getDailyPuzzle(date);

		if (dailyPuzzle) {
			console.log("Daily puzzle already exists:", dailyPuzzle);
			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
				},
				body: JSON.stringify({
					date: dailyPuzzle.date,
					id: dailyPuzzle.id,
				}),
			};
		}

		console.log("Daily puzzle does not exist. Creating new puzzle...");

		const golfers = await fetchGolfers(process.env.S3_GOLFERS_URL);
		console.log(`Fetched ${golfers.length} golfers from S3.`);
		const videoGolfers = golfers.filter((golfer) => golfer.hasVideos === true);
		console.log(`Filtered to ${videoGolfers.length} golfers with videos.`);
		if (golfers.length === 0) {
			throw new Error("No golfers available to create a daily puzzle.");
		}
		const alreadyUsedGolferIds = await db.getAllPuzzleGolferIds();
		let availableGolfers = videoGolfers.filter((golfer) => !alreadyUsedGolferIds.includes(golfer.id));
		if (availableGolfers.length === 0) {
			console.log("All golfers used, resetting pool");
			availableGolfers = videoGolfers;
		}
		const randomIndex = Math.floor(Math.random() * availableGolfers.length);
		const selectedGolfer = availableGolfers[randomIndex];
		dailyPuzzle = await db.createDailyPuzzle({
			date,
			id: selectedGolfer.id,
			golferId: selectedGolfer.playerId,
			fullName: selectedGolfer.name,
		});

		console.log("Created new daily puzzle:", dailyPuzzle);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			},
			body: JSON.stringify({
				date: dailyPuzzle.date,
				golferId: dailyPuzzle.golferId,
			}),
		};
	} catch (error) {
		console.error("Error in getDailyPuzzle handler:", error);
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
