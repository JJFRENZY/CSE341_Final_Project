import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getDb } from '../db/connect.js';
import { jwtCheck, needWrite } from '../middleware/auth.js';

const router = Router();

const ObjectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be 24 hex chars');

const WatchItemSchema = z.object({
  userId: ObjectIdString,                // owner user _id
  kind: z.enum(['anime', 'manga']),
  refId: ObjectIdString,                 // points to anime._id or manga._id
  status: z.enum(['planned','watching','completed','reading']).default('planned'),
  notes: z.string().max(500).optional()
});

const parseId = (id) => {
  try { return new ObjectId(id); }
  catch { const e = new Error('Invalid id format'); e.statusCode = 400; e.expose = true; throw e; }
};

/**
 * @openapi
 * tags:
 *   - name: Watchlists
 *     description: CRUD for user watchlist items
 */

/**
 * @openapi
 * /watchlists:
 *   get:
 *     summary: Get all watchlist items
 *     tags: [Watchlists]
 *     responses:
 *       200:
 *         description: List of watchlist items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/WatchItem' }
 */
router.get('/', async (_req, res, next) => {
  try {
    const docs = await getDb().collection('watchlists').find({}).toArray();
    res.status(200).json(docs);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /watchlists/{id}:
 *   get:
 *     summary: Get a watchlist item by id
 *     tags: [Watchlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: A watchlist item
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WatchItem' }
 *       400: { description: Invalid id }
 *       404: { description: Not found }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const _id = parseId(req.params.id);
    const doc = await getDb().collection('watchlists').findOne({ _id });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(doc);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /watchlists:
 *   post:
 *     summary: Create a watchlist item
 *     tags: [Watchlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/WatchItem' }
 *           example:
 *             userId: "6640a2f2d7b3c1a9f0a11223"
 *             kind: "anime"
 *             refId: "665f6a0f2c3d4b1a9f0a1234"
 *             status: "planned"
 *             notes: "Start this weekend"
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
    const parsed = WatchItemSchema.parse(req.body);
    const now = new Date();
    const result = await getDb().collection('watchlists').insertOne({ ...parsed, createdAt: now, updatedAt: now });
    res.status(201).location(`/watchlists/${result.insertedId}`).json({ id: result.insertedId.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.flatten() });
    next(err);
  }
});

/**
 * @openapi
 * /watchlists/{id}:
 *   put:
 *     summary: Replace a watchlist item
 *     tags: [Watchlists]
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
 *           schema: { $ref: '#/components/schemas/WatchItem' }
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
    const parsed = WatchItemSchema.parse(req.body);
    const result = await getDb().collection('watchlists').replaceOne({ _id }, { ...parsed, updatedAt: new Date() });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.flatten() });
    next(err);
  }
});

/**
 * @openapi
 * /watchlists/{id}:
 *   delete:
 *     summary: Delete a watchlist item
 *     tags: [Watchlists]
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
    const result = await getDb().collection('watchlists').deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
