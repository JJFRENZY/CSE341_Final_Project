// swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Anime & Manga Explorer API',
      version: '1.0.0',
      description:
        'Four collections (anime, manga, users, watchlists) with CRUD, validation, error handling, and bearer JWT security on protected routes.'
    },
    servers: [
      { url: '/', description: 'Render (relative base)' }
      // Optionally add your absolute Render URL:
      // { url: 'https://<your-app>.onrender.com', description: 'Render (absolute)' }
    ],
    components: {
      securitySchemes: {
        // Bearer JWT so you can paste a token in Swagger "Authorize"
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        // --- Anime ---
        Anime: {
          type: 'object',
          required: ['title', 'genres', 'releaseYear', 'status'],
          properties: {
            _id: { type: 'string', example: '665f6a0f2c3d4b1a9f0a1234' },
            title: { type: 'string', example: 'Fullmetal Alchemist: Brotherhood' },
            genres: { type: 'array', items: { type: 'string' }, example: ['Action', 'Adventure'] },
            releaseYear: { type: 'integer', example: 2009 },
            rating: { type: 'number', example: 9.2 },
            episodes: { type: 'integer', example: 64 },
            studio: { type: 'string', example: 'Bones' },
            status: { type: 'string', enum: ['finished', 'airing', 'upcoming'] },
            description: { type: 'string', example: 'Two brothers…' },
            coverImage: { type: 'string', format: 'uri', example: 'https://example.com/img.png' }
          }
        },

        // --- Manga ---
        Manga: {
          type: 'object',
          required: ['title', 'genres', 'author', 'status'],
          properties: {
            _id: { type: 'string', example: '665f6a0f2c3d4b1a9f0a5678' },
            title: { type: 'string', example: 'One Piece' },
            genres: { type: 'array', items: { type: 'string' }, example: ['Adventure', 'Fantasy'] },
            author: { type: 'string', example: 'Eiichiro Oda' },
            chapters: { type: 'integer', example: 1100 },
            status: { type: 'string', enum: ['ongoing', 'finished', 'hiatus'] },
            releaseYear: { type: 'integer', example: 1997 },
            rating: { type: 'number', example: 9.0 },
            description: { type: 'string', example: 'A grand pirate adventure.' },
            coverImage: { type: 'string', format: 'uri', example: 'https://example.com/img2.png' }
          }
        },

        // --- Users (W06) ---
        User: {
          type: 'object',
          required: ['email', 'displayName', 'role'],
          properties: {
            _id: { type: 'string', example: '6640a2f2d7b3c1a9f0a11223' },
            email: { type: 'string', format: 'email', example: 'demo@example.com' },
            displayName: { type: 'string', example: 'Demo User' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-09-15T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-09-16T12:00:00.000Z' }
          }
        },

        // --- Watchlist item (W06) ---
        WatchItem: {
          type: 'object',
          required: ['userId', 'kind', 'refId', 'status'],
          properties: {
            _id: { type: 'string', example: '665f6a0f2c3d4b1a9f0a9abc' },
            userId: { type: 'string', description: 'User ObjectId', example: '6640a2f2d7b3c1a9f0a11223' },
            kind: { type: 'string', enum: ['anime', 'manga'], example: 'anime' },
            refId: {
              type: 'string',
              description: 'Referenced anime/manga ObjectId',
              example: '665f6a0f2c3d4b1a9f0a1234'
            },
            status: {
              type: 'string',
              enum: ['planned', 'watching', 'completed', 'reading'],
              example: 'planned'
            },
            notes: { type: 'string', example: 'Start this weekend' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-09-15T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-09-16T12:00:00.000Z' }
          }
        }
      }
    }
    // NOTE: We do NOT set a global `security` here.
    // Mark protected endpoints with:
    //   security: [{ bearerAuth: [] }]
    // directly in your route JSDoc blocks.
  },
  apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
export const serveSwagger = swaggerUi.serve;
export const setupSwagger = swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    oauth2RedirectUrl: '/api-docs/oauth2-redirect.html'
  }
});
