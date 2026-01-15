// src/controllers/usuarioController.ts
import type {Request, Response} from 'express';
import * as UsuarioService from '../../services/usuario/usuarioService.js';

export const listar = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const busca = (req.query.busca as string) || '';

        const resultado = await UsuarioService.listarUsuarios(page, limit, busca);

        return res.json(resultado);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
};

export const buscarPorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const usuario = await UsuarioService.buscarUsuarioPorId(Number(id));

        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

        return res.json(usuario);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
};

export const criar = async (req: Request, res: Response) => {
    try {
        const {
            nome,
            email,
            senha,
            podeExcluirElementos,
            podeExcluirParticipantes,
            podeGerenciarUsuarios
        } = req.body;

        const novoUsuario = await UsuarioService.criarUsuario({
            nome,
            email,
            senha,
            // E passamos elas para o serviço
            podeExcluirElementos,
            podeExcluirParticipantes,
            podeGerenciarUsuarios
        });

        return res.status(201).json(novoUsuario);
    } catch (error: any) {
        if (error.message === "Email já cadastrado.") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
};

export const atualizar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const idUsuarioAlvo = Number(id);

        // Pega o ID de quem está fazendo a requisição (Do Token)
        const idSolicitante = (req as any).userId;

        // 1. Busca quem está pedindo a alteração para ver as permissões dele
        const solicitante = await UsuarioService.buscarUsuarioPorId(idSolicitante);

        if (!solicitante) return res.status(401).json({ error: "Solicitante inválido" });

        // Verifica se o solicitante TEM PODER para alterar permissões
        const temPoderDeGerencia = solicitante.isSuperAdmin || solicitante.podeGerenciarUsuarios;

        // 2. Prepara os dados que vieram do corpo da requisição
        let {
            nome,
            email,
            senha,
            podeExcluirElementos,
            podeExcluirParticipantes,
            podeGerenciarUsuarios
        } = req.body;

        // 3. TRAVA DE SEGURANÇA:
        if (!temPoderDeGerencia) {
            podeExcluirElementos = undefined;
            podeExcluirParticipantes = undefined;
            podeGerenciarUsuarios = undefined;
        }


        await UsuarioService.atualizarUsuario(idUsuarioAlvo, {
            nome,
            email,
            senha,
            podeExcluirElementos,      // Será undefined se não tiver poder
            podeExcluirParticipantes,  // Será undefined se não tiver poder
            podeGerenciarUsuarios      // Será undefined se não tiver poder
        });

        return res.json({ message: "Usuário atualizado com sucesso" });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
};

export const deletar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Pega o ID do usuário logado que está no Request (colocado pelo middleware de Auth)
        // O uso de 'as any' é para evitar erro de TS se o type Request não foi estendido globalmente
        const idSolicitante = (req as any).userId;

        if (!idSolicitante) {
            return res.status(401).json({ error: "Usuário não identificado." });
        }

        await UsuarioService.deletarUsuario(Number(id), Number(idSolicitante));

        return res.status(204).send();
    } catch (error: any) {
        const msg = error.message;

        if (msg === "Usuário não encontrado.") return res.status(404).json({ error: msg });

        // Retorna 403 (Forbidden) para tentativas proibidas
        if (msg === "O Super Administrador não pode ser excluído." || msg === "Você não pode excluir sua própria conta.") {
            return res.status(403).json({ error: msg });
        }

        return res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
};