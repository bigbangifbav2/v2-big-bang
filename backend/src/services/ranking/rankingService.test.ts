import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as RankingService from './rankingService.js';
import prisma from '../../prismaClient.js';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'vitest-mock-extended';

// 1. Mock do Prisma
vi.mock('../../prismaClient', async () => {
    const actual = await vi.importActual<typeof import('vitest-mock-extended')>('vitest-mock-extended');
    return {
        __esModule: true,
        default: actual.mockDeep<PrismaClient>(),
    };
});

// 2. Import do mock após a definição
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Ranking Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getTopRanking', () => {
        it('Sucesso: Deve retornar todos os registros ordenados por pontuação decrescente', async () => {
            // ARRANGE
            const mockRanking = [
                { id: 1, usuario: 'Campeão', pontuacao: 1000, nivel: 'CIENTISTA' },
                { id: 2, usuario: 'Vice', pontuacao: 800, nivel: 'CURIOSO' },
                { id: 3, usuario: 'Novato', pontuacao: 100, nivel: 'INICIANTE' }
            ];

            prismaMock.ranking.findMany.mockResolvedValue(mockRanking as any);

            // ACT
            const resultado = await RankingService.getTopRanking();

            // ASSERT
            // Verifica se chamou com os parâmetros corretos (orderBy desc e SEM take)
            expect(prismaMock.ranking.findMany).toHaveBeenCalledWith({
                orderBy: {
                    pontuacao: 'desc',
                },
            });

            // Verifica se o resultado é exatamente o que veio do banco
            expect(resultado).toEqual(mockRanking);
            expect(resultado).toHaveLength(3);
        });

        it('Sucesso: Deve retornar array vazio se não houver registros', async () => {
            // ARRANGE
            prismaMock.ranking.findMany.mockResolvedValue([]);

            // ACT
            const resultado = await RankingService.getTopRanking();

            // ASSERT
            expect(resultado).toEqual([]);
            expect(prismaMock.ranking.findMany).toHaveBeenCalled();
        });

        it('Erro: Deve lançar/repassar erro se o banco de dados falhar', async () => {
            // ARRANGE
            prismaMock.ranking.findMany.mockRejectedValue(new Error('Falha na conexão com o DB'));

            // ACT & ASSERT
            // Como o service não tem try/catch (ele deixa o erro subir para o controller),
            // o teste deve esperar que a Promise seja rejeitada.
            await expect(RankingService.getTopRanking())
                .rejects.toThrow('Falha na conexão com o DB');
        });
    });
});