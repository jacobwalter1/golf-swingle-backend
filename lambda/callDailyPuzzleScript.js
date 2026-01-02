import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL; // Update with your API endpoint
const ENDPOINT = "/getDailyPuzzle";
const START_DATE = new Date("2026-01-05");
const NUM_DAYS = 20;

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

// Main function
async function callDailyPuzzles() {
	console.log(`Starting to call getDailyPuzzle for 20 days starting ${formatDate(START_DATE)}`);
	console.log(`API Base URL: ${API_BASE_URL}\n`);

	for (let i = 0; i < NUM_DAYS; i++) {
		const currentDate = new Date(START_DATE);
		currentDate.setDate(currentDate.getDate() + i);
		const dateStr = formatDate(currentDate);

		try {
			const url = `${API_BASE_URL}${ENDPOINT}?date=${dateStr}`;
			console.log(`[${i + 1}/20] Calling: ${url}`);

			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();

			if (response.ok) {
				console.log(`✓ Success (${response.status}):`, data);
			} else {
				console.log(`✗ Error (${response.status}):`, data);
			}
		} catch (error) {
			console.error(`✗ Failed to call for ${dateStr}:`, error.message);
		}

		console.log("");
	}

	console.log("Completed calling getDailyPuzzle for all 20 days");
}

// Run the script
callDailyPuzzles().catch(console.error);
