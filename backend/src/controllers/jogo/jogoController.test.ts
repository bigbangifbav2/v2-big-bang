import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
// Ajuste o caminho para onde está seu controller
import * as JogoController from './jogoController';
// Ajuste o caminho para onde está seu service
import * as JogoService from '../../services/jogo/jogoService.js';

// 1. Mockamos o Service inteiro
vi.mock('../../services/jogo/jogoService', () => ({
    getNiveis: vi.fn(),
    getQuestaoComDicas: vi.fn(),
    submitPontuacao: vi.fn(),
}));

describe('Jogo Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup dos mocks do Express
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });

        req = {
            params: {},
            body: {},
        } as unknown as Request;

        res = {
            status: statusMock,
            json: jsonMock
        } as unknown as Response;
    });

    // --- TESTES: GET NIVEIS ---
    describe('handleGetNiveis', () => {
        it('Sucesso: Deve retornar lista de níveis (200)', async () => {
            const mockNiveis = [{ id: 1, nome: 'Iniciante' }];
            (JogoService.getNiveis as any).mockResolvedValue(mockNiveis);

            await JogoController.handleGetNiveis(req as Request, res as Response);

            expect(JogoService.getNiveis).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockNiveis);
        });

        it('Erro: Deve retornar 500 se o service falhar', async () => {
            (JogoService.getNiveis as any).mockRejectedValue(new Error('Erro DB'));

            await JogoController.handleGetNiveis(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Erro ao carregar níveis.' });
        });
    });

    // --- TESTES: GET QUESTAO ---
    describe('handleGetQuestao', () => {
        it('Validação: Deve retornar 400 se o parametro não for fornecido (embora o Express geralmente trate rotas, testamos a lógica)', async () => {
            // Simulando req.params vazio ou undefined
            req.params = { codNivel: '' };

            await JogoController.handleGetQuestao(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('código do nível') }));
        });

        it('Validação: Deve retornar 400 se o código não for número', async () => {
            req.params = { codNivel: 'abc' };

            await JogoController.handleGetQuestao(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: "Código do nível inválido." });
        });

        it('Sucesso: Deve retornar dados do jogo (200)', async () => {
            req.params = { codNivel: '1' };
            const mockJogo = { rodadas: [] };
            (JogoService.getQuestaoComDicas as any).mockResolvedValue(mockJogo);

            await JogoController.handleGetQuestao(req as Request, res as Response);

            expect(JogoService.getQuestaoComDicas).toHaveBeenCalledWith(1);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockJogo);
        });

        it('Erro: Deve retornar 404 se o service não encontrar ou falhar', async () => {
            req.params = { codNivel: '99' };
            // Controller trata erro do service como 404
            (JogoService.getQuestaoComDicas as any).mockRejectedValue(new Error('Nível não encontrado'));

            await JogoController.handleGetQuestao(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Nível não encontrado' });
        });
    });

    // --- TESTES: SUBMIT PONTUACAO ---
    describe('handleSubmitPontuacao', () => {
        it('Validação: Deve retornar 400 se faltar campos', async () => {
            req.body = { usuario: 'Junior' }; // Faltam pontuacao e nivel

            await JogoController.handleSubmitPontuacao(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('obrigatórios') }));
        });

        it('Validação: Deve retornar 400 se tipos estiverem errados', async () => {
            req.body = {
                usuario: 'Junior',
                pontuacao: '100', // String em vez de number
                nivel: 'INICIANTE'
            };

            await JogoController.handleSubmitPontuacao(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: "Tipos de dados inválidos." });
        });

        it('Sucesso: Deve salvar pontuação (201)', async () => {
            req.body = {
                usuario: 'Junior',
                pontuacao: 100,
                nivel: 'INICIANTE'
            };
            const mockRegistro = { id: 1, ...req.body };
            (JogoService.submitPontuacao as any).mockResolvedValue(mockRegistro);

            await JogoController.handleSubmitPontuacao(req as Request, res as Response);

            expect(JogoService.submitPontuacao).toHaveBeenCalledWith({
                usuario: 'Junior',
                pontuacao: 100,
                nivel: 'INICIANTE'
            });
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: "Pontuação registrada com sucesso!",
                registro: mockRegistro
            }));
        });

        it('Erro: Deve retornar 500 se o service falhar', async () => {
            req.body = { usuario: 'Junior', pontuacao: 100, nivel: 'INICIANTE' };
            (JogoService.submitPontuacao as any).mockRejectedValue(new Error('Erro DB'));

            await JogoController.handleSubmitPontuacao(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Erro interno ao salvar a pontuação.' });
        });
    });
});