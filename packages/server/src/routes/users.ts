import { Router, Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.createUser(req.body.name, req.body.color);
    res.status(201).json(user);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body.name, req.body.color);
    res.json(user);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
