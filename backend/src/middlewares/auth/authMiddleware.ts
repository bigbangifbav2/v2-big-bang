import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: number;
    nome: string;
    iat: number;
    exp: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: "Token não fornecido" });
    }

    // O token vem como "Bearer eyJhbGci..."
    const [, token] = authorization.split(' ');

    try {
        const secret = process.env.JWT_SECRET || 'segredo_padrao';
        const decoded = jwt.verify(token, secret);

        // Adiciona o ID do usuário na requisição (se precisar usar depois)
        const { id } = decoded as TokenPayload;
        req.userId = id;

        return next(); // Pode passar!
    } catch (error) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
};