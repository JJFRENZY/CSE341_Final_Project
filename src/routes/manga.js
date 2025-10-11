import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getDb } from '../db/connect.js';
import { jwtCheck, needWrite } from '../middleware/auth.js';

const router = Router();
const currentYear = new Date().getFullYear();

const MangaSchema = z.object({
  title: z.string().trim().min(1),
  genres: z.array(z.string().trim().min(1)).min(1),
  author: z.string().trim().min(1),
  chapters: z.number().int().min(0).optional(),
  status: z.enum(['ongoing', 'finished', 'hiatus']),
  releaseYear: z.number().int().gte(1960).lte(currentYear + 1).optional(),
  rating: z.number().min(0).max(10).optional(),
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
 *   - name: Manga
 *     description: CRUD for manga
 */

/**
 * @swagger
 * /manga:
 *   get:
 *     summary: Get all manga
 *     tags: [Manga]
 *     responses:
 *       200:
 *         description: List of manga
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Manga' }
 */
router.get('/', async (_req, res, next) => {
  try {
    const docs = await getDb().collection('manga').find({}).toArray();
    res.status(200).json(docs);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /manga/{id}:
 *   get:
 *     summary: Get manga by id
 *     tags: [Manga]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Manga
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Manga' }
 *       400: { description: Invalid id }
 *       404: { description: Not found }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const _id = parseId(req.params.id);
    const doc = await getDb().collection('manga').findOne({ _id });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(doc);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /manga:
 *   post:
 *     summary: Create manga
 *     tags: [Manga]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Manga' }
 *           example:
 *             title: "One Piece"
 *             genres: ["Adventure","Fantasy"]
 *             author: "Eiichiro Oda"
 *             chapters: 1100
 *             status: "ongoing"
 *             releaseYear: 1997
 *             rating: 9.0
 *             description: "A grand pirate adventure."
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
    const parsed = MangaSchema.parse(req.body);
    const result = await getDb().collection('manga').insertOne(parsed);
    res.status(201).location(`/manga/${result.insertedId}`).json({ id: result.insertedId.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.flatten() });
    next(err);
  }
});

/**
 * @swagger
 * /manga/{id}:
 *   put:
 *     summary: Replace manga
 *     tags: [Manga]
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
 *           schema: { $ref: '#/components/schemas/Manga' }
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
    const parsed = MangaSchema.parse(req.body);
    const result = await getDb().collection('manga').replaceOne({ _id }, parsed);
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.flatten() });
    next(err);
  }
});

/**
 * @swagger
 * /manga/{id}:
 *   delete:
 *     summary: Delete manga
 *     tags: [Manga]
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
    const result = await getDb().collection('manga').deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
