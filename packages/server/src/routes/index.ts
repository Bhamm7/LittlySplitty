import { Router } from 'express';
import transactionsRouter from './transactions.js';
import importsRouter from './imports.js';
import categoriesRouter from './categories.js';
import tagsRouter from './tags.js';
import rulesRouter from './rules.js';
import statsRouter from './stats.js';
import plaidRouter from './plaid.js';
import usersRouter from './users.js';

const router = Router();

router.use('/users', usersRouter);
router.use('/transactions', transactionsRouter);
router.use('/imports', importsRouter);
router.use('/categories', categoriesRouter);
router.use('/tags', tagsRouter);
router.use('/rules', rulesRouter);
router.use('/stats', statsRouter);
router.use('/plaid', plaidRouter);

export default router;
