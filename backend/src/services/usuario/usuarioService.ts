// src/services/usuarioService.ts
import prisma from '../../prismaClient.js';
import bcrypt from 'bcryptjs';

// Interfaces para tipar os dados de entrada
interface CreateUsuario {
    nome: string;
    email: string;
    senha: string;
    podeExcluirElementos?: boolean;
    podeExcluirParticipantes?: boolean;
    podeGerenciarUsuarios?: boolean;
}

interface UpdateUsuario {
    nome?: string;
    email?: string;
    senha?: string;
    podeExcluirElementos?: boolean;
    podeExcluirParticipantes?: boolean;
    podeGerenciarUsuarios?: boolean;
}

export const listarUsuarios = async (page: number, limit: number, busca: string) => {
    // Calcula quantos registros pular
    const skip = (page - 1) * limit;

    // Cria o filtro de busca (se houver texto)
    const whereClause = busca ? {
        OR: [
            { nome: { contains: busca } },  // Busca no nome
            { email: { contains: busca } }  // Ou busca no email
        ]
    } : {};

    // 1. Busca os dados paginados
    const usuarios = await prisma.administrador.findMany({
        skip,
        take: limit,
        where: whereClause,
        orderBy: { id: 'desc' },
        select: {
            id: true,
            nome: true,
            email: true,
            // Senha oculta
            isSuperAdmin: true,
            podeExcluirElementos: true,
            podeExcluirParticipantes: true,
            podeGerenciarUsuarios: true
        }
    });

    // 2. Conta o total de registros (para saber quantas páginas existem)
    const total = await prisma.administrador.count({
        where: whereClause
    });

    // Retorna no formato padrão que o frontend espera
    return {
        data: usuarios,
        total,
        pagina: page,
        totalPaginas: Math.ceil(total / limit)
    };
};

export const buscarUsuarioPorId = async (id: number) => {
    return await prisma.administrador.findUnique({
        where: { id },
        select: {
            id: true,
            nome: true,
            email: true,
            isSuperAdmin: true,
            podeExcluirElementos: true,
            podeExcluirParticipantes: true,
            podeGerenciarUsuarios: true
        }
    });
};

export const criarUsuario = async (dados: CreateUsuario) => {
    // 1. Regra de Negócio: Verificar duplicidade
    const existe = await prisma.administrador.findUnique({ where: { email: dados.email } });
    if (existe) {
        throw new Error("Email já cadastrado.");
    }

    // 2. Regra de Negócio: Criptografar senha
    const hashSenha = await bcrypt.hash(dados.senha, 8);

    // 3. Salvar no banco
    const novo = await prisma.administrador.create({
        data: {
            nome: dados.nome,
            email: dados.email,
            senha: hashSenha,
            podeExcluirElementos: dados.podeExcluirElementos || false,
            podeExcluirParticipantes: dados.podeExcluirParticipantes || false,
            podeGerenciarUsuarios: dados.podeGerenciarUsuarios || false,
            isSuperAdmin: false
        }
    });

    return { id: novo.id, nome: novo.nome, email: novo.email };
};

export const atualizarUsuario = async (id: number, dados: UpdateUsuario) => {
    // ALTERAÇÃO 1: Verificar se o usuário existe antes de atualizar
    const usuarioAlvo = await prisma.administrador.findUnique({ where: { id } });
    if (!usuarioAlvo) throw new Error("Usuário não encontrado.");

    // ALTERAÇÃO 2: Incluir as permissões no objeto de atualização
    const dadosParaAtualizar: any = {
        nome: dados.nome,
        email: dados.email,
        podeExcluirElementos: dados.podeExcluirElementos,
        podeExcluirParticipantes: dados.podeExcluirParticipantes,
        podeGerenciarUsuarios: dados.podeGerenciarUsuarios
    };

    // Só criptografa se a senha foi informada
    if (dados.senha) {
        dadosParaAtualizar.senha = await bcrypt.hash(dados.senha, 8);
    }

    return await prisma.administrador.update({
        where: { id },
        data: dadosParaAtualizar
    });
};

export const deletarUsuario = async (idAlvo: number, idSolicitante: number) => {
    // REGRA 1: Auto-exclusão
    if (idAlvo === idSolicitante) {
        throw new Error("Você não pode excluir sua própria conta.");
    }

    const usuarioAlvo = await prisma.administrador.findUnique({ where: { id: idAlvo } });
    const usuarioSolicitante = await prisma.administrador.findUnique({ where: { id: idSolicitante } });
    if (!usuarioAlvo) throw new Error("Usuário não encontrado.");

    // REGRA 2: Proteção do Super Admin
    if (!usuarioSolicitante?.isSuperAdmin) {
        throw new Error("O Super Administrador não pode ser excluído.");
    }

    return await prisma.administrador.delete({ where: { id: idAlvo } });
};