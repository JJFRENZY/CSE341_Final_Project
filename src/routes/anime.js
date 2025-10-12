import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getDb } from '../db/connect.js';
import { jwtCheck, needWrite } from '../middleware/auth.js';

const router = Router();
const currentYear = new Date().getFullYear();

const AnimeSchema = z.object({
  title: z.string().trim().min(1),
  genres: z.array(z.string().trim().min(1)).min(1),
  releaseYear: z.coerce.number().int().gte(1960).lte(currentYear + 1),
  rating: z.coerce.number().min(0).max(10).optional(),
  episodes: z.coerce.number().int().min(0).optional(),
  studio: z.string().trim().optional(),
  status: z.enum(['finished', 'airing', 'upcoming']),
  description: z.string().trim().optional(),
  coverImage: z.string().url().optional()
});

const parseId = (id) => {
  try { return new ObjectId(id); }
  catch { const e = new Error('Invalid id'); e.statusCode = 400; e.expose = true; throw e; }
};

/**
 * @swagger
 * tags:
 *   - name: Anime
 *     description: CRUD for anime
 */

/**
 * @swagger
 * /anime:
 *   get:
 *     summary: Get all anime
 *     tags: [Anime]
 *     responses:
 *       200:
 *         description: List of anime
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Anime' }
 */
router.get('/', async (_req, res, next) => {
  try {
    const docs = await getDb().collection('anime').find({}).toArray();
    res.status(200).json(docs);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /anime/{id}:
 *   get:
 *     summary: Get anime by id
 *     tags: [Anime]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Anime
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Anime' }
 *       400: { description: Invalid id }
 *       404: { description: Not found }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const _id = parseId(req.params.id);
    const doc = await getDb().collection('anime').findOne({ _id });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(doc);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /anime:
 *   post:
 *     summary: Create anime
 *     tags: [Anime]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Anime' }
 *           example:
 *             title: "Fullmetal Alchemist: Brotherhood"
 *             genres: ["Action","Adventure"]
 *             releaseYear: 2009
 *             rating: 9.2
 *             episodes: 64
 *             studio: "Bones"
 *             status: "finished"
 *             description: "Two brothers…"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { id: { type: string } } }
 *       400: { description: Validation error }
 *       415: { description: Unsupported Media Type }
 */
router.post('/', jwtCheck, needWrite, async (req, res, next) => {
  try {
    if (!req.is('application/json')) return res.status(415).json({ message: 'Content-Type must be application/json' });
    const parsed = AnimeSchema.parse(req.body);
    const now = new Date();
    const result = await getDb().collection('anime').insertOne({ ...parsed, createdAt: now, updatedAt: now });
    res.status(201).location(`/anime/${result.insertedId}`).json({ id: result.insertedId.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.flatten() });
    next(err);
  }
});

/**
 * @swagger
 * /anime/{id}:
 *   put:
 *     summary: Replace anime
 *     tags: [Anime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Anime' }
 *     responses:
 *       204: { description: Updated (no content) }
 *       400: { description: Validation/ID error }
 *       404: { description: Not found }
 *       415: { description: Unsupported Media Type }
 */
router.put('/:id', jwtCheck, needWrite, async (req, res, next) => {
  try {
    if (!req.is('application/json')) return res.status(415).json({ message: 'Content-Type must be application/json' });
    const _id = parseId(req.params.id);
    const parsed = AnimeSchema.parse(req.body);
    const result = await getDb().collection('anime').replaceOne({ _id }, { ...parsed, updatedAt: new Date() });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.flatten() });
    next(err);
  }
});

/**
 * @swagger
 * /anime/{id}:
 *   delete:
 *     summary: Delete anime
 *     tags: [Anime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       400: { description: Invalid id }
 *       404: { description: Not found }
 */
router.delete('/:id', jwtCheck, needWrite, async (req, res, next) => {
  try {
    const _id = parseId(req.params.id);
    const result = await getDb().collection('anime').deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
