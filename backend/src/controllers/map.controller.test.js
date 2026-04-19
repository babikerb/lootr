import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

jest.unstable_mockModule('../services/db.service.js', () => ({
  getMapGamesFromDB: jest.fn(),
  updateGameLocationInDB: jest.fn(),
}));

jest.unstable_mockModule('../services/arcgis.service.js', () => ({
  addGameToArcGIS: jest.fn(),
}));

const dbService = await import('../services/db.service.js');
const arcgisService = await import('../services/arcgis.service.js');
const mapRoutes = (await import('../routes/map.routes.js')).default;

const app = express();
app.use(express.json());
app.use('/api/v1/map', mapRoutes);

describe('Map routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Returns map games for the frontend', async () => {
    dbService.getMapGamesFromDB.mockResolvedValue([
      { id: 1, title: 'Bottle Dodge', latitude: 33.7, longitude: -117.8 },
      { id: 2, title: 'Cup Catch', latitude: null, longitude: null },
    ]);

    const response = await request(app).get('/api/v1/map');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe('Bottle Dodge');
  });

  it('2. Places an existing game on the map', async () => {
    dbService.updateGameLocationInDB.mockResolvedValue({
      id: 5,
      title: 'Clock Timing',
      latitude: 33.7455,
      longitude: -117.8677,
    });

    const response = await request(app)
      .post('/api/v1/map/place')
      .send({ gameId: 5, latitude: 33.7455, longitude: -117.8677 });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(5);
    expect(dbService.updateGameLocationInDB).toHaveBeenCalledWith(5, 33.7455, -117.8677);
    expect(arcgisService.addGameToArcGIS).toHaveBeenCalledWith(response.body);
  });

  it('3. Rejects map placement when the payload is invalid', async () => {
    const response = await request(app)
      .post('/api/v1/map/place')
      .send({ gameId: '5', latitude: 33.7455 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(dbService.updateGameLocationInDB).not.toHaveBeenCalled();
  });
});
