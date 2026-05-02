import { Router, Request, Response, NextFunction } from 'express';
import * as statsService from '../services/stats.service.js';

const router = Router();

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await statsService.getSummary(
      req.query.date_from as string,
      req.query.date_to as string,
      req.query.category_id as string | undefined,
      req.query.tag_id as string | undefined,
      req.query.user_id as string | undefined,
      req.query.mode as string | undefined
    );
    res.json(summary);
  } catch (err) { next(err); }
});

router.get('/monthly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const breakdown = await statsService.getMonthlyBreakdown(
      req.query.date_from as string,
      req.query.date_to as string,
      req.query.category_id as string,
      req.query.tag_id as string,
      req.query.user_id as string | undefined,
      req.query.mode as string | undefined
    );
    res.json(breakdown);
  } catch (err) { next(err); }
});

router.get('/recent-imports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    const imports = await statsService.getRecentImports(limit, req.query.user_id as string | undefined);
    res.json(imports);
  } catch (err) { next(err); }
});

router.get('/tax-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
    const report = await statsService.getTaxReport(year, req.query.user_id as string | undefined);
    res.json(report);
  } catch (err) { next(err); }
});

export default router;
