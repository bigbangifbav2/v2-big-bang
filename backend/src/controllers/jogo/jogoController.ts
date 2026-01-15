// src/controllers/jogoController.ts

import { type Request, type Response } from 'express';
import { getNiveis, getQuestaoComDicas, submitPontuacao } from '../../services/jogo/jogoService.js';

// --- HANDLERS PARA BUSCA DE JOGO (GET) ---

export const handleGetNiveis = async (req: Request, res: Response) => {
    try {
        const niveis = await getNiveis();
        return res.status(200).json(niveis);
    } catch (error) {
        console.error("Erro ao buscar níveis:", error);
        return res.status(500).json({ error: 'Erro ao carregar níveis.' });
    }
};

export const handleGetQuestao = async (req: Request, res: Response) => {
    // 1. Extrair o parâmetro da URL
    const codNivelParam = req.params.codNivel; 

    // 2. VALIDAÇÃO: Checa se o parâmetro existe
    if (!codNivelParam) {
        return res.status(400).json({ error: "O código do nível deve ser fornecido na URL." });
    }

    // 3. Converte para número (agora sabemos que é uma string e não undefined)
    const codNivel = parseInt(codNivelParam); 
    
    if (isNaN(codNivel)) {
        return res.status(400).json({ error: "Código do nível inválido." });
    }

    try {
        const dadosJogo = await getQuestaoComDicas(codNivel);
        return res.status(200).json(dadosJogo);
    } catch (error) {
        console.error("Erro ao buscar questão:", error);
        // Retorna 404 se o service não encontrou questões
        return res.status(404).json({ error: (error as Error).message });
    }
};

export const handleSubmitPontuacao = async (req: Request, res: Response) => {
    // 💡 Extrai e tipa o corpo da requisição
    const { usuario, pontuacao, nivel } = req.body;

    // Validação rápida de campos obrigatórios
    if (!usuario || pontuacao == null || !nivel) {
        return res.status(400).json({ error: "Campos 'usuario', 'pontuacao' e 'nivel' são obrigatórios." });
    }

    // Validação de tipo (o TypeScript ajuda, mas o runtime valida)
    if (typeof usuario !== 'string' || typeof pontuacao !== 'number' || typeof nivel !== 'string') {
        return res.status(400).json({ error: "Tipos de dados inválidos." });
    }

    try {
        const novoRegistro = await submitPontuacao({ 
            usuario, 
            pontuacao, 
            // O TS fará o casting implícito, mas você pode garantir que o Nível é um dos ENUMS:
            nivel: nivel as 'INICIANTE' | 'CURIOSO' | 'CIENTISTA' // Asserção de tipo
        });

        // Retorna o registro criado com status 201 (Created)
        return res.status(201).json({ 
            message: "Pontuação registrada com sucesso!",
            registro: novoRegistro 
        });

    } catch (error) {
        console.error("Erro ao submeter pontuação:", error);
        return res.status(500).json({ error: 'Erro interno ao salvar a pontuação.' });
    }
};