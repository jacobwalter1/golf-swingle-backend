import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  QueryCommand,
  ScanCommand 
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ 
  region: process.env.REGION || "us-east-1" 
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLES = {
  PUZZLES: process.env.DYNAMODB_PUZZLES_TABLE || "golf-wordle-daily-puzzles",
  USER_STATS: process.env.DYNAMODB_USER_STATS_TABLE || "golf-wordle-user-stats",
  USER_GAMES: process.env.DYNAMODB_USER_GAMES_TABLE || "golf-wordle-user-games"
};

export const db = {
  // Daily Puzzle Operations
  async getDailyPuzzle(date) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: TABLES.PUZZLES,
        Key: { date }
      }));
      return result.Item || null;
    } catch (error) {
      console.error("Error getting daily puzzle:", error);
      throw error;
    }
  },

  async createDailyPuzzle(puzzleData) {
    try {
      const item = {
        date: puzzleData.date,
        id: puzzleData.id,
        golferId: puzzleData.golferId,
        golferName: puzzleData.fullName,
        totalPlays: 0,
        totalWins: 0,
        createdAt: new Date().toISOString()
      };
      
      await docClient.send(new PutCommand({
        TableName: TABLES.PUZZLES,
        Item: item
      }));
      
      return item;
    } catch (error) {
      console.error("Error creating daily puzzle:", error);
      throw error;
    }
  },

  async updatePuzzleStats(date, won) {
    try {
      await docClient.send(new UpdateCommand({
        TableName: TABLES.PUZZLES,
        Key: { date },
        UpdateExpression: 'ADD totalPlays :one, totalWins :won',
        ExpressionAttributeValues: {
          ':one': 1,
          ':won': won ? 1 : 0
        }
      }));
    } catch (error) {
      console.error("Error updating puzzle stats:", error);
      throw error;
    }
  },

  async getAllPuzzleGolferIds() {
    try {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.PUZZLES,
        ProjectionExpression: 'golferId'
      }));
      return (result.Items || []).map(item => item.golferId);
    } catch (error) {
      console.error("Error getting puzzle golfer IDs:", error);
      throw error;
    }
  },

  // User Stats Operations
  async getUserStats(userId) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: TABLES.USER_STATS,
        Key: { userId }
      }));
      
      return result.Item || {
        userId,
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        lastPlayedDate: null
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  },

  async updateUserStats(userId, statsUpdate) {
    try {
      await docClient.send(new PutCommand({
        TableName: TABLES.USER_STATS,
        Item: {
          userId,
          ...statsUpdate,
          updatedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error("Error updating user stats:", error);
      throw error;
    }
  },

  // User Game Operations
  async getUserGame(userId, date) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: TABLES.USER_GAMES,
        Key: { userId, date }
      }));
      return result.Item || null;
    } catch (error) {
      console.error("Error getting user game:", error);
      throw error;
    }
  },

  async saveUserGame(userId, date, gameData) {
    try {
      await docClient.send(new PutCommand({
        TableName: TABLES.USER_GAMES,
        Item: {
          userId,
          date,
          golferId: gameData.golferId,
          won: gameData.won,
          guesses: gameData.guesses,
          guessedGolferIds: gameData.guessedGolferIds || [],
          completedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error("Error saving user game:", error);
      throw error;
    }
  }
};