import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getDb } from '../db/connect.js';
import { jwtCheck, needWrite } from '../middleware/auth.js';

const router = Router();

const UserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  role: z.enum(['user', 'admin']).default('user')
});

const parseId = (id) => {
  try { return new ObjectId(id); }
  catch { const e = new Error('Invalid id format'); e.statusCode = 400; e.expose = true; throw e; }
};

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: CRUD for users (demo). In a real app, users are created during OAuth provisioning.
 */

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 */
router.get('/', async (_req, res, next) => {
  try {
    const docs = await getDb().collection('users').find({}).toArray();
    res.status(200).json(docs);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       400: { description: Invalid id }
 *       404: { description: Not found }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const _id = parseId(req.params.id);
    const doc = await getDb().collection('users').findOne({ _id });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(doc);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/User' }
 *           example:
 *             email: "demo@example.com"
 *             displayName: "Demo User"
 *             role: "user"
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
    const parsed = UserSchema.parse(req.body);
    const now = new Date();
    const result = await getDb().collection('users').insertOne({ ...parsed, createdAt: now, updatedAt: now });
    res.status(201).location(`/users/${result.insertedId}`).json({ id: result.insertedId.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.flatten() });
    next(err);
  }
});

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Replace a user
 *     tags: [Users]
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
 *           schema: { $ref: '#/components/schemas/User' }
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
    const parsed = UserSchema.parse(req.body);
    const result = await getDb().collection('users').replaceOne({ _id }, { ...parsed, updatedAt: new Date() });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.flatten() });
    next(err);
  }
});

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
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
    const result = await getDb().collection('users').deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
