import { Router, Request, Response, NextFunction } from 'express';
import * as tagService from '../services/tag.service.js';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await tagService.listTags();
    res.json(tags);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tag = await tagService.createTag(req.body);
    res.status(201).json(tag);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tag = await tagService.updateTag(req.params.id as string, req.body);
    res.json(tag);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tagService.deleteTag(req.params.id as string);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
