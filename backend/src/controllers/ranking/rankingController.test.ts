import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
// Ajuste o caminho/extensão conforme seu projeto (se usa .js ou não nos imports)
import { handleGetRanking } from './rankingController.js';

// --- MOCK DO SERVICE (COM HOISTING) ---
const { mockGetTopRanking } = vi.hoisted(() => {
    return {
        mockGetTopRanking: vi.fn(),
    };
});

vi.mock('../../services/ranking/rankingService.js', () => ({
    getTopRanking: mockGetTopRanking,
}));

describe('Ranking Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup dos mocks do Express
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });

        req = {} as unknown as Request;

        res = {
            status: statusMock,
            json: jsonMock,
        } as unknown as Response;
    });

    // --- TESTES ---

    it('Sucesso: Deve retornar a lista de ranking com status 200', async () => {
        // Arrange (Preparação)
        const mockDadosRanking = [
            { nome: 'Junior', pontuacao: 1000, nivel: 'CIENTISTA' },
            { nome: 'Teste', pontuacao: 500, nivel: 'INICIANTE' }
        ];

        mockGetTopRanking.mockResolvedValue(mockDadosRanking);

        // Act (Ação)
        await handleGetRanking(req as Request, res as Response);

        // Assert (Verificação)
        expect(mockGetTopRanking).toHaveBeenCalledTimes(1); // Foi chamado?
        expect(statusMock).toHaveBeenCalledWith(200);       // Status HTTP ok?
        expect(jsonMock).toHaveBeenCalledWith(mockDadosRanking); // Retornou o JSON certo?
    });

    it('Erro: Deve retornar 500 se o service falhar', async () => {
        // Arrange
        mockGetTopRanking.mockRejectedValue(new Error('Erro de conexão com BD'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Act
        await handleGetRanking(req as Request, res as Response);

        // Assert
        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Não foi possível carregar o ranking.' });

        // Limpa o spy do console
        consoleSpy.mockRestore();
    });
});