import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FUNCTIONS = ["getDailyPuzzle", "submitGuess"];

const LAMBDA_ROLE_ARN = process.env.LAMBDA_ROLE_ARN;

if (!LAMBDA_ROLE_ARN) {
	console.error(" LAMBDA_ROLE_ARN environment variable is required");
	process.exit(1);
}

async function createZip(functionName) {
	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(path.join(__dirname, `${functionName}.zip`));
		const archive = archiver("zip", { zlib: { level: 9 } });

		output.on("close", () => {
			console.log(`  Created ${functionName}.zip (${archive.pointer()} bytes)`);
			resolve();
		});

		archive.on("error", (err) => reject(err));
		archive.pipe(output);

		// Add the function file
		archive.file(path.join(__dirname, "functions", `${functionName}.js`), {
			name: "index.js",
		});

		// Add shared folder
		archive.directory(path.join(__dirname, "shared"), "shared");

		// Add package.json and package-lock.json
		archive.file(path.join(__dirname, "package.json"), { name: "package.json" });

		const packageLock = path.join(__dirname, "package-lock.json");
		if (fs.existsSync(packageLock)) {
			archive.file(packageLock, { name: "package-lock.json" });
		}

		// Note: node_modules excluded - Lambda will install from package.json

		archive.finalize();
	});
}

async function deployFunction(functionName) {
	console.log(`\n Deploying ${functionName}...`);

	const zipFile = path.join(__dirname, `${functionName}.zip`);

	try {
		const envVars = {
			REGION: "us-east-1",
		};

		// Check if function exists
		try {
			execSync(`aws lambda get-function --function-name ${functionName} --region ${envVars.REGION}`, { stdio: "ignore" });

			// Function exists, update code and configuration
			console.log(`  Updating existing function...`);
			execSync(
				`aws lambda update-function-code --function-name ${functionName} --region ${envVars.REGION} --zip-file fileb://"${zipFile}"`,
				{
					stdio: "inherit",
				}
			);

			console.log(` ${functionName} deployed successfully`);

			// Clean up zip file
			fs.unlinkSync(zipFile);
		} catch (error) {
			console.error(` Failed to deploy ${functionName}:`, error.message);
			throw error;
		}
	} catch (error) {
		console.error(` Failed to deploy ${functionName}:`, error.message);
		throw error;
	}
}

async function main() {

	// Check if node_modules exists
	if (!fs.existsSync(path.join(__dirname, "node_modules"))) {
		console.log("Installing dependencies...");
		execSync("npm install", { stdio: "inherit" });
	}

	for (const functionName of FUNCTIONS) {
		try {
			// Create zip
			await createZip(functionName);

			// Deploy
			await deployFunction(functionName);
		} catch (error) {
			console.error(`Failed to deploy ${functionName}:`, error.message);
			process.exit(1);
		}
	}
	console.log("\n All functions deployed successfully");
}

main();
