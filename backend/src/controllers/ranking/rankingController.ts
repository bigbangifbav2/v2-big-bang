// src/controllers/rankingController.ts

import { type Request, type Response } from 'express';
import { getTopRanking } from '../../services/ranking/rankingService.js'; // Note o .js

export const handleGetRanking = async (req: Request, res: Response) => {
    try {
        // 💡 O Controlador chama o Serviço para buscar os dados.
        const topRanking = await getTopRanking(); 
        
        // Retorna a resposta HTTP 200 (OK) com os dados em formato JSON.
        return res.status(200).json(topRanking);
        
    } catch (error) {
        console.error("Erro ao buscar ranking:", error);
        return res.status(500).json({ error: 'Não foi possível carregar o ranking.' });
    }
};