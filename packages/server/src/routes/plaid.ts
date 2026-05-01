import { Router, Request, Response, NextFunction } from 'express';
import * as plaidService from '../services/plaid.service.js';

const router = Router();

router.post('/link-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    const result = await plaidService.createLinkToken(user_id);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/exchange-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { public_token, user_id } = req.body;
    if (!public_token) {
      return res.status(400).json({ error: 'public_token is required' });
    }
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    const result = await plaidService.exchangePublicToken(public_token, user_id);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await plaidService.listPlaidItems(req.query.user_id as string | undefined);
    res.json(items);
  } catch (err) { next(err); }
});

router.post('/items/:id/sync', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const result = await plaidService.syncTransactions(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

router.delete('/items/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await plaidService.deletePlaidItem(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
