import { Router, Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service.js';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.listCategories();
    res.json(categories);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.updateCategory(req.params.id as string, req.body);
    res.json(category);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoryService.deleteCategory(req.params.id as string);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
