import { jest } from '@jest/globals'; // Import Jest's global object for ESM
import express from 'express';
import request from 'supertest';
import { FALLBACK_CONFIG } from '../utils/validation.js';

// Mock the service BEFORE importing the files that use it
jest.unstable_mockModule('../services/groq.service.js', () => ({
  generateGameConfig: jest.fn(),
}));

jest.unstable_mockModule('../services/db.service.js', () => ({
  saveGameToDB: jest.fn(),
  getAllGamesFromDB: jest.fn(),
}));

jest.unstable_mockModule('../services/arcgis.service.js', () => ({
  addGameToArcGIS: jest.fn(),
}));

// Dynamically import the mocked service AND the routes that depend on it
const groqService = await import('../services/groq.service.js');
const dbService = await import('../services/db.service.js');
const gameRoutes = (await import('../routes/game.routes.js')).default;

// Setup a fake Express app just for this test file
const app = express();
app.use(express.json());
app.use('/api/v1/game', gameRoutes);

describe('POST /api/v1/game/generate', () => {
  
  // Clear the mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Should return a valid game config when the LLM succeeds', async () => {
    const mockSuccessResponse = {
      gameType: "swipe",
      title: "Slice the Apple",
      rules: ["Swipe your finger to slice!", "Don't hit the bombs!"],
      icon: { library: "mci", name: "food-apple" },
      parameters: { speed: 1.5, gravity: 1.2 }
    };
    // Force our fake mock to return the success response
    groqService.generateGameConfig.mockResolvedValue(mockSuccessResponse);
    dbService.saveGameToDB.mockResolvedValue({
      id: 7,
      object_label: 'apple',
      game_type: 'swipe',
      title: 'Slice the Apple',
      rules: ['Swipe your finger to slice!', "Don't hit the bombs!"],
      parameters: { speed: 1.5, gravity: 1.2 },
      latitude: null,
      longitude: null,
    });

    const response = await request(app)
      .post('/api/v1/game/generate')
      .send({ objectLabel: 'apple' });

    expect(response.status).toBe(200);
    expect(response.body.game_type).toBe('swipe');
    expect(response.body.title).toBe('Slice the Apple');
    expect(groqService.generateGameConfig).toHaveBeenCalledWith('apple'); 
    expect(dbService.saveGameToDB).toHaveBeenCalledWith('apple', mockSuccessResponse, undefined, undefined);
  });

  it('2. Should return the Fallback Config if the LLM crashes or times out', async () => {
    // Force our fake mock to simulate a crash/timeout
    groqService.generateGameConfig.mockResolvedValue(FALLBACK_CONFIG);
    dbService.saveGameToDB.mockResolvedValue({
      id: 9,
      object_label: 'weird unknown object',
      game_type: FALLBACK_CONFIG.gameType,
      title: FALLBACK_CONFIG.title,
      rules: FALLBACK_CONFIG.rules,
      parameters: FALLBACK_CONFIG.parameters,
      latitude: null,
      longitude: null,
    });

    const response = await request(app)
      .post('/api/v1/game/generate')
      .send({ objectLabel: 'weird unknown object' });

    expect(response.status).toBe(200);
    expect(response.body.game_type).toBe(FALLBACK_CONFIG.gameType); 
    expect(response.body.title).toBe(FALLBACK_CONFIG.title);
  });

  it('3. Should return 400 Bad Request if the mobile app forgets the objectLabel', async () => {
    const response = await request(app)
      .post('/api/v1/game/generate')
      .send({}); // Missing objectLabel

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(groqService.generateGameConfig).not.toHaveBeenCalled(); 
  });
});
