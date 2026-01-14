import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './authMiddleware';
import jwt from 'jsonwebtoken';

// 1. Mock do JWT
vi.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup básico do Express
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });
        next = vi.fn(); // O next é apenas uma função espiã

        req = {
            headers: {},
        } as any;

        res = {
            status: statusMock,
            json: jsonMock,
        } as unknown as Response;
    });

    it('Deve retornar 401 se o token não for fornecido', () => {
        // Arrange: Header vazio
        req.headers = {};

        // Act
        authMiddleware(req as Request, res as Response, next);

        // Assert
        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Token não fornecido" });
        expect(next).not.toHaveBeenCalled(); // Garante que não deixou passar
    });

    it('Deve retornar 401 se o token for inválido ou expirado', () => {
        // Arrange: Header com token "podre"
        req.headers = { authorization: 'Bearer token_invalido' };

        // Simulamos o JWT explodindo com erro
        (jwt.verify as any).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        // Act
        authMiddleware(req as Request, res as Response, next);

        // Assert
        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Token inválido ou expirado" });
        expect(next).not.toHaveBeenCalled();
    });

    it('Sucesso: Deve chamar next() e adicionar userId ao request se token for válido', () => {
        // Arrange
        req.headers = { authorization: 'Bearer token_valido_123' };

        // Simulamos o JWT decodificando com sucesso
        const payloadDecodificado = { id: 99, nome: 'Tester' };
        (jwt.verify as any).mockReturnValue(payloadDecodificado);

        // Act
        authMiddleware(req as Request, res as Response, next);

        // Assert
        // 1. Verifica se chamou next() (deixou passar)
        expect(next).toHaveBeenCalled();

        // 2. Verifica se NÃO deu erro
        expect(statusMock).not.toHaveBeenCalled();

        // 3. O Pulo do Gato: Verifica se ele injetou o ID no request
        // (Usamos 'as any' pois userId não existe no tipo padrão do Request)
        expect((req as any).userId).toBe(99);
    });
});