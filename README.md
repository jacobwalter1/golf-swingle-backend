# Golf Swingle Backend

Backend infrastructure for the Golf Swingle daily puzzle game. This repository contains AWS Lambda functions for game logic and utilities for managing golfer data and video content on S3.

## Project Structure

```
golf-swingle-backend/
├── lambda/                      # AWS Lambda functions
│   ├── functions/              # Lambda handlers
│   │   ├── getDailyPuzzle.js  # Returns/creates daily puzzle
│   │   └── submitGuess.js     # Validates guesses and updates stats
│   ├── shared/                 # Shared utilities
│   │   ├── dbClient.js        # DynamoDB operations
│   │   ├── gameLogic.js       # Game logic utilities
│   │   └── s3Client.js        # S3 operations
│   ├── tests/                  # Local tests
│   ├── deploy.js              # Lambda deployment script
│   ├── .env.example           # Environment template
│   └── package.json
│
└── s3/                         # S3 video management
    ├── scripts/               # Utility scripts
    │   └── hasVideosScript.js # Sync golfer hasVideos flags
    ├── generateGolfers.py     # Transform golfer JSON data
    ├── generateMaskedVideos.py # Create masked video levels
    ├── uploadNewVideos.ps1    # Upload videos to S3
    ├── .env.example          # Environment template
    └── venv/                 # Python virtual environment
```

## Setup

### Lambda Setup

1. **Navigate to lambda folder:**

    ```bash
    cd lambda
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure environment:**

    ```bash
    cp .env.example .env
    # Edit .env with your AWS credentials and settings
    ```

4. **Deploy Lambda functions:**
    ```bash
    npm run deploy
    ```

### S3 Video Management Setup

1. **Navigate to s3 folder:**

    ```bash
    cd s3
    ```

2. **Create Python virtual environment:**

    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # Windows
    # source venv/bin/activate  # macOS/Linux
    ```

3. **Install Python dependencies:**

    ```bash
    pip install opencv-python rembg numpy scipy
    ```

4. **Configure environment:**

    ```bash
    cp .env.example .env
    # Edit .env with your S3 bucket and region
    ```

5. **Install scripts dependencies:**
    ```bash
    cd scripts
    npm install
    cd ..
    ```

## Lambda Functions

### getDailyPuzzle

Returns today's puzzle or creates a new one if it doesn't exist.

**Endpoint:** `GET /daily-puzzle`

**Response:**

```json
{
	"date": "2024-12-28",
	"id": 5,
	"golferId": "tiger-woods"
}
```

**Features:**

-   Creates daily puzzle from available golfers with videos
-   Avoids repeating golfers until all have been used
-   Returns puzzle stats (total plays, wins)

### submitGuess

Validates player's guess and updates statistics if game is complete.

**Endpoint:** `POST /submit-guess`

**Request Body:**

```json
{
	"userId": "user_123",
	"guessedGolferId": "tiger-woods",
	"guessCount": 3,
	"guessedGolferIds": ["rory-mcilroy", "jordan-spieth", "tiger-woods"]
}
```

**Response:**

```json
{
	"isCorrect": true,
	"gameOver": true,
	"answer": {
		"golferId": "tiger-woods",
		"golferName": "Tiger Woods"
	}
}
```

**Features:**

-   Validates guesses against daily puzzle
-   Updates user statistics (streaks, win rate, guess distribution)
-   Saves game history
-   Updates puzzle statistics

## S3 Video Management

### Generate Masked Videos

Creates multiple blur levels for golf swing videos to support the reveal mechanic:

```bash
cd s3
.\uploadNewVideos.ps1
```

This script:

1. Runs `generateMaskedVideos.py` to create masked video levels
2. Uploads videos to S3
3. Syncs golfer data with available videos

### Sync Golfer Data

Updates the `hasVideos` flag for golfers based on S3 content:

```bash
cd s3/scripts
npm run sync
```

### Transform Golfer Data

Process raw golfer JSON into the required format:

```bash
cd s3
python generateGolfers.py
```

## Environment Variables

### Lambda (.env)

```env
REGION=us-east-1
S3_BUCKET=your-s3-bucket-name
S3_GOLFERS_URL=https://your-s3-bucket-name.s3.amazonaws.com/golfers/golfers.json
DYNAMODB_PUZZLES_TABLE=golf-wordle-daily-puzzles
DYNAMODB_USER_STATS_TABLE=golf-wordle-user-stats
DYNAMODB_USER_GAMES_TABLE=golf-wordle-user-games
LAMBDA_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_LAMBDA_ROLE_NAME
```

### S3 (.env)

```env
REGION=us-east-1
S3_BUCKET=your-s3-bucket-name
```

## DynamoDB Tables

### golf-wordle-daily-puzzles

-   **Partition Key:** `date` (String)
-   Stores daily puzzle configuration
-   Tracks puzzle statistics (plays, wins)

### golf-wordle-user-stats

-   **Partition Key:** `userId` (String)
-   Stores user statistics and streaks
-   Tracks guess distribution

### golf-wordle-user-games

-   **Partition Key:** `userId` (String)
-   **Sort Key:** `date` (String)
-   Stores individual game results

## Testing

Run local tests without AWS:

```bash
cd lambda
npm test
```

## AWS Cost Estimate

-   **DynamoDB:** ~$1-2/month (on-demand pricing)
-   **Lambda:** Free tier covers typical usage (1M requests/month)
-   **S3:** Storage and transfer costs for videos
-   **Total:** ~$5-10/month depending on usage

## Development Workflow

1. **Add new golfer videos:** Place in `s3/videos_to_process/`
2. **Generate masked versions:** Run `uploadNewVideos.ps1`
3. **Sync golfer data:** Automatic via upload script
4. **Test Lambda functions:** Use local tests or AWS console
5. **Deploy updates:** Run `npm run deploy` in lambda folder


## Todo
- Create new functions that will save and return user stats
- Add authorization
- Create unlimited mode

