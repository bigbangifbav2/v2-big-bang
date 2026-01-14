// src/routes/rankingRoutes.ts

import { Router } from 'express';
import { handleGetRanking } from '../controllers/ranking/rankingController.js'; // Note o .js

const router = Router();

// 💡 Mapeia o método GET no path '/' para a função handleGetRanking
// (Quando for chamado via app.use('/api/ranking', ...), a URL completa será /api/ranking)
router.get('/', handleGetRanking);

export default router;