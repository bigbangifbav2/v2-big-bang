import prisma from '../../prismaClient.js';

export const getTopRanking =async () => {
    // Se o seu ranking for enorme (milhares), use um número alto (ex: take: 1000)
    const allRankingEntries = await prisma.ranking.findMany({
        orderBy: {
            pontuacao: 'desc', // Ordena pelo score geral
        },
    });

    return allRankingEntries;
};