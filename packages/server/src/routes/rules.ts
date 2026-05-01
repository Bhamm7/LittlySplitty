import { Router, Request, Response, NextFunction } from 'express';
import * as ruleService from '../services/rule.service.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await ruleService.listRules(req.query.user_id as string | undefined);
    res.json(rules);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await ruleService.createRule(req.body);
    res.status(201).json(rule);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await ruleService.updateRule(req.params.id as string, req.body);
    res.json(rule);
  } catch (err) { next(err); }
});

router.patch('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { is_active } = req.body;
    const rule = await ruleService.toggleRule(req.params.id as string, is_active);
    res.json(rule);
  } catch (err) { next(err); }
});

router.post('/:id/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ruleService.applyRule(req.params.id as string);
    res.json(result);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ruleService.deleteRule(req.params.id as string);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
