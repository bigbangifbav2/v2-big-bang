import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as ElementoController from './elementoController.js';
import * as ElementoService from '../../services/elemento/elementoService.js';

// 1. Mockamos o Service inteiro
vi.mock('../../services/elemento/elementoService', () => ({
    listarElementos: vi.fn(),
    buscarPorId: vi.fn(),
    criarElemento: vi.fn(),
    atualizarElemento: vi.fn(),
    deletarElemento: vi.fn(),
}));

describe('Elemento Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;
    let sendMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup dos mocks do Express
        jsonMock = vi.fn();
        sendMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock, send: sendMock });

        req = {
            params: {},
            query: {},
            body: {},
            files: {} // Importante para o Multer
        } as unknown as Request;

        res = {
            status: statusMock,
            json: jsonMock,
            send: sendMock
        } as unknown as Response;
    });

    // --- LISTAR ---
    describe('listar', () => {
        it('Sucesso: Deve retornar lista paginada (Status 200)', async () => {
            // Arrange
            req.query = { page: '1', limit: '10' };
            const mockResultado = { dados: [], total: 0, pagina: 1 };
            (ElementoService.listarElementos as any).mockResolvedValue(mockResultado);

            // Act
            await ElementoController.listar(req as Request, res as Response);

            // Assert
            expect(ElementoService.listarElementos).toHaveBeenCalledWith(1, 10, undefined);
            expect(res.json).toHaveBeenCalledWith(mockResultado);
        });

        it('Erro: Deve retornar 500 se o service falhar', async () => {
            (ElementoService.listarElementos as any).mockRejectedValue(new Error('Erro DB'));

            await ElementoController.listar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Erro ao listar' });
        });
    });

    // --- BUSCAR POR ID ---
    describe('buscarPorId', () => {
        it('Sucesso: Deve retornar o elemento se encontrado', async () => {
            req.params = { id: '1' };
            const mockElemento = { id: 1, nome: 'Hidrogênio' };
            (ElementoService.buscarPorId as any).mockResolvedValue(mockElemento);

            await ElementoController.buscarPorId(req as Request, res as Response);

            expect(ElementoService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockElemento);
        });

        it('Erro: Deve retornar 404 se não encontrar', async () => {
            req.params = { id: '99' };
            (ElementoService.buscarPorId as any).mockResolvedValue(null);

            await ElementoController.buscarPorId(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Não encontrado' });
        });
    });

    describe('criar', () => {
        it('Sucesso: Deve processar arquivos e criar elemento (Status 201)', async () => {
            // Arrange: Simulando Multipart Form Data (Multer)
            req.body = {
                nome: 'Hélio',
                simbolo: 'He',
                nivel: '1',
                dicas: '["Gás Nobre", "Leve"]' // Simulando string JSON enviada pelo form
            };
            req.files = {
                'imagem': [{ filename: 'foto-he.png' } as Express.Multer.File],
                'imagemDistribuicao': [{ filename: 'dist-he.png' } as Express.Multer.File]
            };

            const mockCriado = { id: 2, nome: 'Hélio' };
            (ElementoService.criarElemento as any).mockResolvedValue(mockCriado);

            // Act
            await ElementoController.criar(req as Request, res as Response);

            // Assert
            // Verifica se converteu o JSON de dicas e passou os nomes dos arquivos
            expect(ElementoService.criarElemento).toHaveBeenCalledWith(
                expect.objectContaining({
                    nome: 'Hélio',
                    simbolo: 'He',
                    nivel: 1,
                    dicas: ['Gás Nobre', 'Leve']
                }),
                'foto-he.png',
                'dist-he.png'
            );
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCriado);
        });

        it('Sucesso: Deve aceitar dicas como array direto', async () => {
            req.body = { dicas: ['Dica 1'] };
            req.files = {}; // Sem arquivos

            (ElementoService.criarElemento as any).mockResolvedValue({});

            await ElementoController.criar(req as Request, res as Response);

            expect(ElementoService.criarElemento).toHaveBeenCalledWith(
                expect.objectContaining({ dicas: ['Dica 1'] }),
                undefined,
                undefined
            );
        });

        it('Erro: Deve retornar 400 se o service falhar (ex: validação)', async () => {
            (ElementoService.criarElemento as any).mockRejectedValue(new Error('Nome obrigatório'));

            await ElementoController.criar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Nome obrigatório' });
        });
    });

    // --- ATUALIZAR ---
    describe('atualizar', () => {
        it('Sucesso: Deve atualizar dados parciais', async () => {
            req.params = { id: '1' };
            req.body = { nome: 'Novo Nome' };
            req.files = {
                'imagem': [{ filename: 'nova-foto.png' } as Express.Multer.File]
            };

            const mockAtualizado = { id: 1, nome: 'Novo Nome' };
            (ElementoService.atualizarElemento as any).mockResolvedValue(mockAtualizado);

            await ElementoController.atualizar(req as Request, res as Response);

            expect(ElementoService.atualizarElemento).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ nome: 'Novo Nome' }),
                'nova-foto.png',
                undefined
            );
            expect(res.json).toHaveBeenCalledWith(mockAtualizado);
        });

        it('Erro: Deve retornar 500 em caso de falha', async () => {
            (ElementoService.atualizarElemento as any).mockRejectedValue(new Error('Erro DB'));

            await ElementoController.atualizar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    // --- DELETAR ---
    describe('deletar', () => {
        it('Sucesso: Deve retornar 204 (No Content)', async () => {
            req.params = { id: '10' };
            (ElementoService.deletarElemento as any).mockResolvedValue(true);

            await ElementoController.deletar(req as Request, res as Response);

            expect(ElementoService.deletarElemento).toHaveBeenCalledWith(10);
            expect(statusMock).toHaveBeenCalledWith(204);
            expect(sendMock).toHaveBeenCalled();
        });

        it('Erro: Deve retornar 500 se falhar', async () => {
            (ElementoService.deletarElemento as any).mockRejectedValue(new Error('Erro'));

            await ElementoController.deletar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});