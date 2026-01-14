import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdminWelcome from './AdminWelcome';

describe('Página AdminWelcome', () => {

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    // =========================================================================
    // 1. HAPPY PATH (Cenários de Sucesso)
    // =========================================================================

    it('Deve renderizar o nome do usuário corretamente quando existir no localStorage', () => {
        // 1. Simula o dado salvo no login
        const mockUser = { nome: 'Carlos Silva', id: 1 };
        localStorage.setItem('adminUser', JSON.stringify(mockUser));

        render(<AdminWelcome />);

        // 2. Verifica se o nome aparece na tela
        expect(screen.getByText('Bem-vindo(a), Carlos Silva! 👋')).toBeInTheDocument();
    });

    it('Deve renderizar o texto de instrução padrão', () => {
        render(<AdminWelcome />);

        expect(screen.getByText(/Este é o painel de controle do/i)).toBeInTheDocument();
        expect(screen.getByText(/BigBang Quiz/i)).toBeInTheDocument();
        expect(screen.getByText(/Utilize o menu lateral/i)).toBeInTheDocument();
    });

    // =========================================================================
    // 2. UNHAPPY PATH / EDGE CASES (Cenários de Borda)
    // =========================================================================

    it('Deve exibir "Admin" se o campo nome estiver vazio no objeto', () => {
        localStorage.setItem('adminUser', JSON.stringify({ id: 1 }));

        render(<AdminWelcome />);

        expect(screen.getByText('Bem-vindo(a), Admin! 👋')).toBeInTheDocument();
    });

    it('Deve exibir "Admin" se o localStorage estiver vazio/nulo', () => {
        // Garante que está vazio
        localStorage.removeItem('adminUser');

        render(<AdminWelcome />);

        // O código faz: JSON.parse(null || '{}') -> {} -> {}.nome é undefined -> 'Admin'
        expect(screen.getByText('Bem-vindo(a), Admin! 👋')).toBeInTheDocument();
    });

    it('Deve quebrar se o JSON no localStorage for inválido (Teste de Robustez)', () => {

        // Simula o dado corrompido
        localStorage.setItem('adminUser', 'Texto que não é JSON');

        expect(() => render(<AdminWelcome />)).toThrow();
    });
});