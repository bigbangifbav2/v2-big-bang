import { type Request, type Response } from 'express';
import prisma from '../../prismaClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Método para criar o primeiro admin (apenas para uso inicial)
export const registrar = async (req: Request, res: Response) => {
    const { nome, email, senha } = req.body;

    // Criptografa a senha antes de salvar
    const hashSenha = await bcrypt.hash(senha, 10);

    try {
        const admin = await prisma.administrador.create({
            data: { nome, email, senha: hashSenha }
        });
        // Remove a senha do retorno
        const { senha: _, ...adminSemSenha } = admin;
        return res.status(201).json(adminSemSenha);
    } catch (error) {
        return res.status(400).json({ error: "E-mail já cadastrado ou erro ao criar." });
    }
};

// Método de Login
export const login = async (req: Request, res: Response) => {
    const { email, senha } = req.body;

    // 1. Busca o usuário
    const admin = await prisma.administrador.findUnique({ where: { email } });

    if (!admin) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    // 2. Compara a senha enviada com o hash do banco
    const senhaValida = await bcrypt.compare(senha, admin.senha);

    if (!senhaValida) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    // 3. Gera o Token JWT
    const secret = process.env.JWT_SECRET || 'segredo_padrao';
    const token = jwt.sign({ id: admin.id, nome: admin.nome }, secret, {
        expiresIn: '1d' // Token expira em 1 dia
    });

    // 4. Retorna dados do usuário e o token
    return res.json({
        user: {
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            isSuperAdmin: admin.isSuperAdmin,
            podeGerenciarUsuarios: admin.podeGerenciarUsuarios,
            podeExcluirElementos: admin.podeExcluirElementos,
            podeExcluirParticipantes: admin.podeExcluirParticipantes
        },
        token
    });
};