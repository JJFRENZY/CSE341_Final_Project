import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectToDb } from './src/db/connect.js';
import animeRouter from './src/routes/anime.js';
import mangaRouter from './src/routes/manga.js';
import usersRouter from './src/routes/users.js';
import watchlistsRouter from './src/routes/watchlists.js';
import { serveSwagger, setupSwagger, swaggerSpec } from './swagger.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.set('trust proxy', 1);

// Fail fast for missing DB config
for (const key of ['MONGODB_URI', 'DB_NAME']) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Health + root
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/', (_req, res) => res.send('Anime & Manga Explorer API up'));

// Routes (two from W05 + two new for W06)
app.use('/anime', animeRouter);
app.use('/manga', mangaRouter);
app.use('/users', usersRouter);
app.use('/watchlists', watchlistsRouter);

// Swagger UI + raw spec
app.use('/api-docs', serveSwagger, setupSwagger);
app.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const expose = err.expose ?? false;
  res.status(status).json({
    message: expose ? err.message : 'Internal Server Error'
  });
});

const start = async () => {
  try {
    await connectToDb(process.env.MONGODB_URI, process.env.DB_NAME);
    app.listen(PORT, () => console.log(`🚀 Listening on :${PORT}`));
  } catch (e) {
    console.error('❌ Failed to start:', e.message);
    process.exit(1);
  }
};

start();
