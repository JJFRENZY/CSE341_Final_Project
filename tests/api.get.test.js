// tests/api.get.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Default to your local port 8045; can override with TEST_BASE env
const BASE = process.env.TEST_BASE || 'http://localhost:8045';

// Well-formed (likely) nonexistent ObjectIds for 404/400 checks
const BAD_IDS = [
  '56816b8bdaf759f43071afe0',
  'f4af93a68c2bce0f39564267'
];

describe('GET — Anime', () => {
  it('GET /anime -> 200 array', async () => {
    const r = await request(BASE).get('/anime');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('GET /anime/:id (nonexistent) -> 404 or 400', async () => {
    const r = await request(BASE).get(`/anime/${BAD_IDS[0]}`);
    expect([400, 404]).toContain(r.status);
  });
});

describe('GET — Manga', () => {
  it('GET /manga -> 200 array', async () => {
    const r = await request(BASE).get('/manga');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('GET /manga/:id (nonexistent) -> 404 or 400', async () => {
    const r = await request(BASE).get(`/manga/${BAD_IDS[1]}`);
    expect([400, 404]).toContain(r.status);
  });
});

describe('GET — Users', () => {
  it('GET /users -> 200 array', async () => {
    const r = await request(BASE).get('/users');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('GET /users/:id (nonexistent) -> 404 or 400', async () => {
    const r = await request(BASE).get(`/users/${BAD_IDS[0]}`);
    expect([400, 404]).toContain(r.status);
  });
});

describe('GET — Watchlists', () => {
  it('GET /watchlists -> 200 array', async () => {
    const r = await request(BASE).get('/watchlists');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('GET /watchlists/:id (nonexistent) -> 404 or 400', async () => {
    const r = await request(BASE).get(`/watchlists/${BAD_IDS[1]}`);
    expect([400, 404]).toContain(r.status);
  });
});
