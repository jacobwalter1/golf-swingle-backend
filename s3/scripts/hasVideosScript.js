import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory (s3 folder)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const s3 = new S3Client({ region: process.env.REGION || "us-east-2" });
const BUCKET = process.env.S3_BUCKET;

async function syncGolfers() {
	console.log("🔍 Checking S3 for video folders...");

	// 1. List all video folders
	const result = await s3.send(
		new ListObjectsV2Command({
			Bucket: BUCKET,
			Prefix: "videos/",
			Delimiter: "/",
		})
	);

	const videoFolders = (result.CommonPrefixes || []).map((p) => p.Prefix.replace("videos/", "").replace("/", ""));

	console.log(`Found ${videoFolders.length} folders:`, videoFolders);

	// 2. Download golfers.json
	const objResult = await s3.send(
		new GetObjectCommand({
			Bucket: BUCKET,
			Key: "golfers/golfers.json",
		})
	);

	const golfers = JSON.parse(await objResult.Body.transformToString());

	// 3. Update hasVideos flags
	let updated = 0;
	golfers.forEach((golfer) => {
		const hasVideos = videoFolders.includes(golfer.playerId);
		if (golfer.hasVideos !== hasVideos) {
			console.log(`${golfer.fullName}: ${golfer.hasVideos} → ${hasVideos}`);
			golfer.hasVideos = hasVideos;
			updated++;
		}
	});

	if (updated === 0) {
		console.log("✅ No changes needed");
		return;
	}

	// 4. Upload updated golfers.json
	await s3.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: "golfers/golfers.json",
			Body: JSON.stringify(golfers, null, 2),
			ContentType: "application/json",
		})
	);

	console.log(`✅ Updated ${updated} golfers`);
}

syncGolfers();
