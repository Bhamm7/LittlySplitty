import { Router, Request, Response, NextFunction } from 'express';
import * as transactionService from '../services/transaction.service.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      user_id: req.query.user_id as string | undefined,
      category_id: req.query.category_id as string | undefined,
      tag_id: req.query.tag_id as string | undefined,
      is_ignored: req.query.is_ignored !== undefined ? req.query.is_ignored === 'true' : undefined,
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      sort_by: req.query.sort_by as string | undefined,
      sort_dir: req.query.sort_dir as 'asc' | 'desc' | undefined,
    };
    const result = await transactionService.listTransactions(filters);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await transactionService.getTransaction(req.params.id as string);
    res.json(transaction);
  } catch (err) { next(err); }
});

router.patch('/bulk/update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, changes } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }
    const result = await transactionService.bulkUpdateTransactions(ids, changes);
    res.json(result);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id as string, req.body);
    res.json(transaction);
  } catch (err) { next(err); }
});

export default router;
