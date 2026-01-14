import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RotaProtegida from './RotaProtegida';
import { BrowserRouter } from 'react-router-dom';

// --- MOCKS ---

vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        Navigate: ({ to }: { to: string }) => <div data-testid="navigate-mock">{to}</div>
    };
});

describe('Componente RotaProtegida', () => {

    beforeEach(() => {
        // Limpa o storage antes de cada teste
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    const renderWithRouter = (ui: React.ReactElement) => {
        return render(
            <BrowserRouter>
                {ui}
            </BrowserRouter>
        );
    };

    // =========================================================================
    // 1. HAPPY PATH (Usuário Logado)
    // =========================================================================

    it('Deve renderizar o conteúdo filho (children) se o token existir', () => {
        sessionStorage.setItem('token', 'fake-jwt-token');

        renderWithRouter(
            <RotaProtegida>
                <h1>Conteúdo Secreto do Admin</h1>
            </RotaProtegida>
        );

        expect(screen.getByText('Conteúdo Secreto do Admin')).toBeInTheDocument();

        expect(screen.queryByTestId('navigate-mock')).not.toBeInTheDocument();
    });

    // =========================================================================
    // 2. UNHAPPY PATH (Usuário Não Logado)
    // =========================================================================

    it('Deve redirecionar para /login se NÃO houver token', () => {
        sessionStorage.removeItem('token');

        renderWithRouter(
            <RotaProtegida>
                <h1>Conteúdo Secreto</h1>
            </RotaProtegida>
        );

        expect(screen.queryByText('Conteúdo Secreto')).not.toBeInTheDocument();

        const redirect = screen.getByTestId('navigate-mock');
        expect(redirect).toBeInTheDocument();
        expect(redirect).toHaveTextContent('/login');
    });
});