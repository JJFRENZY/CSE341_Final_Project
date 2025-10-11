// swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Anime & Manga Explorer API',
      version: '1.0.0',
      description: 'Two collections (anime, manga) with CRUD, validation, and error handling.'
    },
    servers: [
      { url: '/', description: 'Render (relative base)' }
      // Optionally add your absolute Render URL:
      // { url: 'https://<your-app>.onrender.com', description: 'Render (absolute)' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        Anime: {
          type: 'object',
          required: ['title', 'genres', 'releaseYear', 'status'],
          properties: {
            _id: { type: 'string', example: '665f6a0f2c3d4b1a9f0a1234' },
            title: { type: 'string', example: 'Fullmetal Alchemist: Brotherhood' },
            genres: { type: 'array', items: { type: 'string' }, example: ['Action','Adventure'] },
            releaseYear: { type: 'integer', example: 2009 },
            rating: { type: 'number', example: 9.2 },
            episodes: { type: 'integer', example: 64 },
            studio: { type: 'string', example: 'Bones' },
            status: { type: 'string', enum: ['finished','airing','upcoming'] },
            description: { type: 'string', example: 'Two brothers…' },
            coverImage: { type: 'string', format: 'uri', example: 'https://example.com/img.png' }
          }
        },
        Manga: {
          type: 'object',
          required: ['title', 'genres', 'author', 'status'],
          properties: {
            _id: { type: 'string', example: '665f6a0f2c3d4b1a9f0a5678' },
            title: { type: 'string', example: 'One Piece' },
            genres: { type: 'array', items: { type: 'string' }, example: ['Adventure','Fantasy'] },
            author: { type: 'string', example: 'Eiichiro Oda' },
            chapters: { type: 'integer', example: 1100 },
            status: { type: 'string', enum: ['ongoing','finished','hiatus'] },
            releaseYear: { type: 'integer', example: 1997 },
            rating: { type: 'number', example: 9.0 },
            description: { type: 'string', example: 'A grand pirate adventure.' },
            coverImage: { type: 'string', format: 'uri', example: 'https://example.com/img2.png' }
          }
        }
      }
    }
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
