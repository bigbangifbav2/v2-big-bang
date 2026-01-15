import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as UsuarioService from './usuarioService.js';
import prisma from '../../prismaClient.js';
import bcrypt from 'bcryptjs';
import { DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

// 1. Setup do Mock do Prisma
vi.mock('../../prismaClient', async () => {
    const actual = await vi.importActual<typeof import('vitest-mock-extended')>('vitest-mock-extended');
    return {
        __esModule: true,
        default: actual.mockDeep<PrismaClient>(),
    };
});

// 2. Mock do Bcryptjs (CORRIGIDO)
vi.mock('bcryptjs', () => {
    const mockBcrypt = {
        hash: vi.fn(),
        compare: vi.fn()
    };

    return {
        __esModule: true, // Importante para simular módulo ES
        default: mockBcrypt, // Isso resolve o "No default export"
        ...mockBcrypt // Isso resolve caso alguém use "import { hash } from..."
    };
});

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Usuario Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- LISTAR USUÁRIOS ---
    describe('listarUsuarios', () => {
        it('Sucesso: Deve retornar lista paginada e total', async () => {
            const mockUsuarios = [
                { id: 1, nome: 'Admin', email: 'admin@test.com' }
            ];
            const mockTotal = 1;

            prismaMock.administrador.findMany.mockResolvedValue(mockUsuarios as any);
            prismaMock.administrador.count.mockResolvedValue(mockTotal);

            const resultado = await UsuarioService.listarUsuarios(1, 10, '');

            expect(prismaMock.administrador.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 0,
                take: 10,
                where: {}
            }));
            expect(resultado.data).toEqual(mockUsuarios);
            expect(resultado.totalPaginas).toBe(1);
        });

        it('Sucesso: Deve aplicar filtro de busca (OR)', async () => {
            prismaMock.administrador.findMany.mockResolvedValue([]);
            prismaMock.administrador.count.mockResolvedValue(0);

            await UsuarioService.listarUsuarios(1, 10, 'teste');

            expect(prismaMock.administrador.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    OR: [
                        { nome: { contains: 'teste' } },
                        { email: { contains: 'teste' } }
                    ]
                }
            }));
        });
    });

    // --- BUSCAR POR ID ---
    describe('buscarUsuarioPorId', () => {
        it('Sucesso: Deve retornar usuário sem a senha', async () => {
            const mockUser = { id: 1, nome: 'User', email: 'u@test.com' };
            prismaMock.administrador.findUnique.mockResolvedValue(mockUser as any);

            const result = await UsuarioService.buscarUsuarioPorId(1);

            expect(result).toEqual(mockUser);
            expect(prismaMock.administrador.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                select: expect.objectContaining({ id: true, nome: true })
            }));
        });

        it('Sucesso: Retorna null se não encontrar', async () => {
            prismaMock.administrador.findUnique.mockResolvedValue(null);
            const result = await UsuarioService.buscarUsuarioPorId(99);
            expect(result).toBeNull();
        });
    });

    // --- CRIAR USUÁRIO ---
    describe('criarUsuario', () => {
        const dadosCreate = {
            nome: 'Novo',
            email: 'novo@test.com',
            senha: '123'
        };

        it('Sucesso: Deve criptografar a senha e criar usuário', async () => {
            prismaMock.administrador.findUnique.mockResolvedValue(null);

            // Agora o mock funciona corretamente no default import
            (bcrypt.hash as any).mockResolvedValue('hash_segura_123');

            prismaMock.administrador.create.mockResolvedValue({
                id: 1, ...dadosCreate, senha: 'hash_segura_123'
            } as any);

            const result = await UsuarioService.criarUsuario(dadosCreate);

            expect(bcrypt.hash).toHaveBeenCalledWith('123', 8);
            expect(prismaMock.administrador.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ senha: 'hash_segura_123' })
            }));
            expect(result).toHaveProperty('id');
        });

        it('Erro: Deve falhar se email já existe', async () => {
            prismaMock.administrador.findUnique.mockResolvedValue({ id: 5 } as any);

            await expect(UsuarioService.criarUsuario(dadosCreate))
                .rejects.toThrow("Email já cadastrado.");

            expect(prismaMock.administrador.create).not.toHaveBeenCalled();
        });
    });

    // --- ATUALIZAR USUÁRIO ---
    describe('atualizarUsuario', () => {
        it('Sucesso: Deve atualizar dados básicos (sem senha)', async () => {
            prismaMock.administrador.findUnique.mockResolvedValue({ id: 1 } as any);
            prismaMock.administrador.update.mockResolvedValue({} as any);

            await UsuarioService.atualizarUsuario(1, { nome: 'Nome Novo' });

            // Verifica se NÃO chamou o bcrypt
            expect(bcrypt.hash).not.toHaveBeenCalled();

            expect(prismaMock.administrador.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 1 },
                data: expect.objectContaining({ nome: 'Nome Novo' })
            }));
        });

        it('Sucesso: Deve criptografar nova senha se fornecida', async () => {
            prismaMock.administrador.findUnique.mockResolvedValue({ id: 1 } as any);
            (bcrypt.hash as any).mockResolvedValue('nova_hash');

            await UsuarioService.atualizarUsuario(1, { senha: '123' });

            expect(bcrypt.hash).toHaveBeenCalled();
            expect(prismaMock.administrador.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ senha: 'nova_hash' })
            }));
        });

        it('Erro: Deve falhar se usuário não existir', async () => {
            prismaMock.administrador.findUnique.mockResolvedValue(null);

            await expect(UsuarioService.atualizarUsuario(99, { nome: 'X' }))
                .rejects.toThrow("Usuário não encontrado.");
        });
    });

    // --- DELETAR USUÁRIO ---
    describe('deletarUsuario', () => {
        it('Sucesso: Deve deletar se solicitante for Super Admin e alvo for outro', async () => {
            const alvoId = 2;
            const solicitanteId = 1;

            prismaMock.administrador.findUnique
                .mockResolvedValueOnce({ id: alvoId } as any)
                .mockResolvedValueOnce({ id: solicitanteId, isSuperAdmin: true } as any);

            prismaMock.administrador.delete.mockResolvedValue({} as any);

            await UsuarioService.deletarUsuario(alvoId, solicitanteId);

            expect(prismaMock.administrador.delete).toHaveBeenCalledWith({ where: { id: alvoId } });
        });

        it('Erro: Deve impedir auto-exclusão', async () => {
            await expect(UsuarioService.deletarUsuario(1, 1))
                .rejects.toThrow("Você não pode excluir sua própria conta.");

            expect(prismaMock.administrador.delete).not.toHaveBeenCalled();
        });

        it('Erro: Deve falhar se usuário alvo não existe', async () => {
            prismaMock.administrador.findUnique.mockResolvedValue(null);

            await expect(UsuarioService.deletarUsuario(99, 1))
                .rejects.toThrow("Usuário não encontrado.");
        });

        it('Erro: Deve falhar se solicitante NÃO for Super Admin', async () => {
            const alvoId = 2;
            const solicitanteId = 3;

            prismaMock.administrador.findUnique
                .mockResolvedValueOnce({ id: alvoId } as any)
                .mockResolvedValueOnce({ id: solicitanteId, isSuperAdmin: false } as any);

            await expect(UsuarioService.deletarUsuario(alvoId, solicitanteId))
                .rejects.toThrow("O Super Administrador não pode ser excluído.");
        });
    });
});