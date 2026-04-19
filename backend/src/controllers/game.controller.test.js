import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals'; // Import Jest's global object for ESM
import { FALLBACK_CONFIG } from '../utils/validation.js';

// Mock the service BEFORE importing the files that use it
jest.unstable_mockModule('../services/groq.service.js', () => ({
  generateGameConfig: jest.fn(),
}));

// Dynamically import the mocked service AND the routes that depend on it
const groqService = await import('../services/groq.service.js');
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
      parameters: { speed: 1.5, gravity: 1.2 }
    };
    // Force our fake mock to return the success response
    groqService.generateGameConfig.mockResolvedValue(mockSuccessResponse);

    const response = await request(app)
      .post('/api/v1/game/generate')
      .send({ objectLabel: 'apple' });

    expect(response.status).toBe(200);
    expect(response.body.gameType).toBe('swipe');
    expect(response.body.title).toBe('Slice the Apple');
    expect(groqService.generateGameConfig).toHaveBeenCalledWith('apple'); 
  });

  it('2. Should return the Fallback Config if the LLM crashes or times out', async () => {
    // Force our fake mock to simulate a crash/timeout
    groqService.generateGameConfig.mockResolvedValue(FALLBACK_CONFIG);

    const response = await request(app)
      .post('/api/v1/game/generate')
      .send({ objectLabel: 'weird unknown object' });

    expect(response.status).toBe(200);
    expect(response.body.gameType).toBe(FALLBACK_CONFIG.gameType); 
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