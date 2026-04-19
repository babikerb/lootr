import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

jest.unstable_mockModule('../services/db.service.js', () => ({
  saveLaunchLocationToDB: jest.fn(),
}));

const dbService = await import('../services/db.service.js');
const locationRoutes = (await import('../routes/location.routes.js')).default;

const app = express();
app.use(express.json());
app.use('/api/v1/location', locationRoutes);

describe('POST /api/v1/location', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Saves launch coordinates when both values are provided', async () => {
    dbService.saveLaunchLocationToDB.mockResolvedValue({
      id: 1,
      latitude: 33.7455,
      longitude: -117.8677,
    });

    const response = await request(app)
      .post('/api/v1/location')
      .send({ latitude: 33.7455, longitude: -117.8677 });

    expect(response.status).toBe(201);
    expect(response.body.latitude).toBe(33.7455);
    expect(response.body.longitude).toBe(-117.8677);
    expect(dbService.saveLaunchLocationToDB).toHaveBeenCalledWith(33.7455, -117.8677);
  });

  it('2. Returns 400 when coordinates are missing', async () => {
    const response = await request(app)
      .post('/api/v1/location')
      .send({ latitude: 33.7455 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(dbService.saveLaunchLocationToDB).not.toHaveBeenCalled();
  });
});
