import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as UsuarioController from './usuarioController';
import * as UsuarioService from '../../services/usuario/usuarioService.js';

const {
    mockListar,
    mockBuscar,
    mockCriar,
    mockAtualizar,
    mockDeletar
} = vi.hoisted(() => {
    return {
        mockListar: vi.fn(),
        mockBuscar: vi.fn(),
        mockCriar: vi.fn(),
        mockAtualizar: vi.fn(),
        mockDeletar: vi.fn(),
    };
});

// 2. Injetamos no módulo
vi.mock('../../services/usuario/usuarioService.js', () => ({
    listarUsuarios: mockListar,
    buscarUsuarioPorId: mockBuscar,
    criarUsuario: mockCriar,
    atualizarUsuario: mockAtualizar,
    deletarUsuario: mockDeletar,
}));

describe('Usuario Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;
    let sendMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        jsonMock = vi.fn();
        sendMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock, send: sendMock });

        req = {
            params: {},
            query: {},
            body: {},
            userId: 1
        } as any; // 'as any' porque userId não existe no tipo Request padrão do Express

        res = {
            status: statusMock,
            json: jsonMock,
            send: sendMock
        } as unknown as Response;
    });

    // --- LISTAR ---
    describe('listar', () => {
        it('Sucesso: Deve retornar lista paginada', async () => {
            req.query = { page: '1', limit: '5' };
            const mockResultado = { dados: [], total: 0 };
            mockListar.mockResolvedValue(mockResultado);

            await UsuarioController.listar(req as Request, res as Response);

            expect(mockListar).toHaveBeenCalledWith(1, 5, '');
            expect(res.json).toHaveBeenCalledWith(mockResultado);
        });

        it('Erro: Deve retornar 500 se falhar', async () => {
            mockListar.mockRejectedValue(new Error('Erro'));
            await UsuarioController.listar(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    // --- BUSCAR POR ID ---
    describe('buscarPorId', () => {
        it('Sucesso: Deve retornar o usuário', async () => {
            req.params = { id: '10' };
            mockBuscar.mockResolvedValue({ id: 10, nome: 'Teste' });

            await UsuarioController.buscarPorId(req as Request, res as Response);

            expect(mockBuscar).toHaveBeenCalledWith(10);
            expect(res.json).toHaveBeenCalledWith({ id: 10, nome: 'Teste' });
        });

        it('Erro: Deve retornar 404 se não encontrar', async () => {
            req.params = { id: '99' };
            mockBuscar.mockResolvedValue(null);

            await UsuarioController.buscarPorId(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Usuário não encontrado' });
        });
    });

    // --- CRIAR ---
    describe('criar', () => {
        it('Sucesso: Deve criar usuário e retornar 201', async () => {
            req.body = {
                nome: 'Novo',
                email: 'novo@teste.com',
                senha: '123',
                podeGerenciarUsuarios: true
            };
            mockCriar.mockResolvedValue({ id: 1, ...req.body });

            await UsuarioController.criar(req as Request, res as Response);

            expect(mockCriar).toHaveBeenCalledWith(expect.objectContaining({
                email: 'novo@teste.com',
                podeGerenciarUsuarios: true
            }));
            expect(statusMock).toHaveBeenCalledWith(201);
        });

        it('Erro: Deve retornar 400 se email já existe', async () => {
            mockCriar.mockRejectedValue(new Error("Email já cadastrado."));

            await UsuarioController.criar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: "Email já cadastrado." });
        });

        it('Erro: Deve retornar 500 para erro genérico', async () => {
            mockCriar.mockRejectedValue(new Error("Erro DB"));
            await UsuarioController.criar(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    // --- ATUALIZAR (Lógica de Segurança) ---
    describe('atualizar', () => {
        it('Segurança: Admin pode alterar permissões', async () => {
            req.params = { id: '20' };
            (req as any).userId = 1; // Quem pede é o ID 1

            req.body = {
                nome: 'Alterado',
                podeGerenciarUsuarios: true // Tentando dar poder
            };

            // Simula que o solicitante (ID 1) É ADMIN
            mockBuscar.mockResolvedValue({ id: 1, isSuperAdmin: true });

            await UsuarioController.atualizar(req as Request, res as Response);

            // Verifica se o service foi chamado COM a permissão true
            expect(mockAtualizar).toHaveBeenCalledWith(20, expect.objectContaining({
                nome: 'Alterado',
                podeGerenciarUsuarios: true
            }));
        });

        it('Segurança: Usuário comum NÃO pode alterar permissões (Trava de Segurança)', async () => {
            req.params = { id: '20' };
            (req as any).userId = 2; // Quem pede é o ID 2

            req.body = {
                nome: 'Hacker',
                podeGerenciarUsuarios: true // Tentando se dar poder via Postman
            };

            // Simula que o solicitante (ID 2) NÃO É ADMIN
            mockBuscar.mockResolvedValue({
                id: 2,
                isSuperAdmin: false,
                podeGerenciarUsuarios: false
            });

            await UsuarioController.atualizar(req as Request, res as Response);

            expect(mockAtualizar).toHaveBeenCalledWith(20, {
                nome: 'Hacker',
                email: undefined,
                senha: undefined,
                podeExcluirElementos: undefined,
                podeExcluirParticipantes: undefined,
                podeGerenciarUsuarios: undefined
            });
        });

        it('Erro: Deve retornar 401 se solicitante não existir', async () => {
            mockBuscar.mockResolvedValue(null); // Solicitante não achado no banco
            await UsuarioController.atualizar(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(401);
        });
    });

    // --- DELETAR ---
    describe('deletar', () => {
        it('Sucesso: Deve deletar e retornar 204', async () => {
            req.params = { id: '10' };
            (req as any).userId = 1; // Solicitante

            await UsuarioController.deletar(req as Request, res as Response);

            expect(mockDeletar).toHaveBeenCalledWith(10, 1);
            expect(statusMock).toHaveBeenCalledWith(204);
        });

        it('Erro: Deve retornar 403 se tentar deletar Super Admin', async () => {
            mockDeletar.mockRejectedValue(new Error("O Super Administrador não pode ser excluído."));

            await UsuarioController.deletar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining("Super Administrador")
            }));
        });

        it('Erro: Deve retornar 403 se tentar se auto-deletar', async () => {
            mockDeletar.mockRejectedValue(new Error("Você não pode excluir sua própria conta."));

            await UsuarioController.deletar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
        });

        it('Erro: Deve retornar 404 se usuário não existe', async () => {
            mockDeletar.mockRejectedValue(new Error("Usuário não encontrado."));

            await UsuarioController.deletar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });
    });
});