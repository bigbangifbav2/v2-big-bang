import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
// Ajuste os caminhos conforme sua estrutura real
import { registrar, login } from './authController';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
// Importamos aqui para tipagem, mas dentro do mock usaremos o import dinâmico ou global
import { DeepMockProxy } from 'vitest-mock-extended';

// 1. Mock das dependências externas
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

// 2. Mock do Prisma Client - CORREÇÃO DE HOISTING
vi.mock('../../prismaClient', async () => {
    // Importamos a biblioteca DE DENTRO do mock para evitar erro de referência
    const actual = await vi.importActual<typeof import('vitest-mock-extended')>('vitest-mock-extended');
    return {
        __esModule: true,
        default: actual.mockDeep<PrismaClient>(),
    };
});

// 3. Import do mock (após o vi.mock)
import prisma from '../../prismaClient';

// 4. Cast para o tipo do Mock
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Auth Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });

        res = {
            status: statusMock,
            json: jsonMock
        } as unknown as Response;
    });

    // --- TESTES DE REGISTRO ---

    describe('Funcionalidade: Registrar', () => {
        it('Deve registrar um novo administrador com sucesso (Status 201)', async () => {
            req = { body: { nome: 'Admin', email: 'admin@test.com', senha: '123' } };

            (bcrypt.hash as any).mockResolvedValue('senha_hash_segura');

            // Configura o retorno do mock
            prismaMock.administrador.create.mockResolvedValue({
                id: 1,
                nome: 'Admin',
                email: 'admin@test.com',
                senha: 'senha_hash_segura',
                isSuperAdmin: false,
                podeGerenciarUsuarios: true,
                podeExcluirElementos: false,
                podeExcluirParticipantes: false
            } as any);

            await registrar(req as Request, res as Response);

            expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
            expect(prismaMock.administrador.create).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(201);
        });

        it('Deve retornar erro 400 se o email já existir', async () => {
            req = { body: { email: 'existente@test.com', senha: '123' } };

            prismaMock.administrador.create.mockRejectedValue(new Error('Email duplicado'));

            await registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });
    });

    // --- TESTES DE LOGIN ---

    describe('Funcionalidade: Login', () => {
        beforeEach(() => {
            req = { body: { email: 'admin@test.com', senha: '123' } };
        });

        it('Deve realizar login com sucesso e retornar Token', async () => {
            const mockAdmin = {
                id: 1,
                email: 'admin@test.com',
                senha: 'hash_do_banco',
                isSuperAdmin: true
            };

            prismaMock.administrador.findUnique.mockResolvedValue(mockAdmin as any);
            (bcrypt.compare as any).mockResolvedValue(true);
            (jwt.sign as any).mockReturnValue('token_falso_jwt');

            await login(req as Request, res as Response);

            expect(statusMock).not.toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                token: 'token_falso_jwt'
            }));
        });

        it('Deve negar login se usuário não for encontrado (401)', async () => {
            prismaMock.administrador.findUnique.mockResolvedValue(null);

            await login(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
        });

        it('Deve negar login se a senha estiver incorreta (401)', async () => {
            prismaMock.administrador.findUnique.mockResolvedValue({
                email: 'admin@test.com',
                senha: 'hash_real'
            } as any);

            (bcrypt.compare as any).mockResolvedValue(false);

            await login(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
        });
    });
});