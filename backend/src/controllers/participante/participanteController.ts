import { type Request, type Response } from 'express';
import * as ParticipanteService from '../../services/participante/participanteService.js';

export const listar = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10; // Padrão de 10 por página

        const resultado = await ParticipanteService.listarParticipantes(page, limit);
        return res.json(resultado);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao listar participantes' });
    }
};

export const deletar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await ParticipanteService.deletarParticipante(Number(id));
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao deletar participante' });
    }
};

// Se quiser implementar a edição de nome depois
export const atualizar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;
        const atualizado = await ParticipanteService.atualizarParticipante(Number(id), nome);
        return res.json(atualizado);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao atualizar participante' });
    }
};