// src/routes/jogoRoutes.ts

import { Router } from 'express';
import { handleGetNiveis, handleGetQuestao, handleSubmitPontuacao } from '../controllers/jogo/jogoController.js';

const router = Router();

// Rota 1: Listar todos os níveis (GET /api/jogo/niveis)
router.get('/niveis', handleGetNiveis);

// Rota 2: Buscar uma questão para um nível (GET /api/jogo/questao/1)
router.get('/questao/:codNivel', handleGetQuestao);

// 💡 Rota POST: POST /api/jogo/submeter-pontuacao
router.post('/submeter-pontuacao', handleSubmitPontuacao);

export default router;