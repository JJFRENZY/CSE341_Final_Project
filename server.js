import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectToDb } from './src/db/connect.js';
import animeRouter from './src/routes/anime.js';
import mangaRouter from './src/routes/manga.js';
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

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health + root
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/', (_req, res) => res.send('Anime & Manga Explorer API up'));

// Routes
app.use('/anime', animeRouter);
app.use('/manga', mangaRouter);

// Swagger UI + raw spec
app.use('/api-docs', serveSwagger, setupSwagger);
app.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Not found
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));
// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const expose = err.expose ?? false;
  res.status(status).json({ message: expose ? err.message : 'Internal Server Error' });
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
