// src/services/participante/participanteService.ts

import prisma from '../../prismaClient.js';

interface ResultadoPaginado {
    data: any[];
    total: number;
    pagina: number;
    totalPaginas: number;
}

export const listarParticipantes = async (page: number = 1, limit: number = 10): Promise<ResultadoPaginado> => {
    const skip = (page - 1) * limit;

    // Executa em paralelo: Contagem total e Busca da página
    const [total, participantes] = await prisma.$transaction([
        prisma.ranking.count(),
        prisma.ranking.findMany({
            orderBy: { pontuacao: 'desc' },
            skip,
            take: limit
        })
    ]);

    return {
        data: participantes,
        total,
        pagina: page,
        totalPaginas: Math.ceil(total / limit)
    };
};

export const deletarParticipante = async (codRanking: number) => {
    return await prisma.ranking.delete({ where: { codRanking } });
};

export const atualizarParticipante = async (codRanking: number, novoNome: string) => {
    return await prisma.ranking.update({
        where: { codRanking },
        data: { usuario: novoNome }
    });
};