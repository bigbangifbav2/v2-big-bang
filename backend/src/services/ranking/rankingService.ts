import prisma from '../../prismaClient.js'; // Lembre-se do .js no import

export const getTopRanking =async () => {
    // 💡 REMOVE o 'take' para que o backend envie todos os registros
    // Se o seu ranking for enorme (milhares), use um número alto (ex: take: 1000)
    const allRankingEntries = await prisma.ranking.findMany({
        orderBy: {
            pontuacao: 'desc', // Ordena pelo score geral
        },
        // REMOVA O TAKE AQUI, ou use um valor alto para garantir que todos cheguem ao frontend
    });

    return allRankingEntries;
};