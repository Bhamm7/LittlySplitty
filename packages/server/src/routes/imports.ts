import { Router, Request, Response, NextFunction } from 'express';
import { upload } from '../middleware/upload.js';
import * as importService from '../services/import.service.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const imports = await importService.listImports(req.query.user_id as string | undefined);
    res.json(imports);
  } catch (err) { next(err); }
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const userId = req.body.user_id as string;
    if (!userId) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }
    const preview = await importService.uploadAndPreview(req.file.buffer, req.file.originalname, userId);
    res.json(preview);
  } catch (err) { next(err); }
});

router.post('/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { file_hash } = req.body;
    if (!file_hash) {
      res.status(400).json({ error: 'file_hash is required' });
      return;
    }
    const result = await importService.confirmImport(file_hash as string);
    res.json(result);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await importService.deleteImport(req.params.id as string);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
