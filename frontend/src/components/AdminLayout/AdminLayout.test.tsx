import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';

// --- MOCKS ---

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
    };
});

describe('Componente AdminLayout', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        document.body.className = '';
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<AdminLayout />}>
                        <Route path="admin" element={<div>Conteúdo da Dashboard</div>} />
                        <Route path="admin/usuarios" element={<div>Conteúdo de Usuários</div>} />
                    </Route>
                </Routes>
            </BrowserRouter>
        );
    };

    // =========================================================================
    // 1. RENDERIZAÇÃO E DADOS (HAPPY PATH)
    // =========================================================================

    it('Deve renderizar a sidebar, o nome do usuário e o conteúdo principal', () => {
        // Simula usuário logado
        sessionStorage.setItem('adminUser', JSON.stringify({ nome: 'Administrador Teste' }));

        renderComponent();

        // Verifica Sidebar
        expect(screen.getByText('BigBang Admin')).toBeInTheDocument();

        // Verifica Links
        expect(screen.getByText('Início')).toBeInTheDocument();
        expect(screen.getByText('Elementos')).toBeInTheDocument();

        // Verifica Nome do Usuário
        expect(screen.getByText('Administrador Teste')).toBeInTheDocument();
    });

    it('Deve renderizar o conteúdo filho (Outlet)', () => {
        // Simula estar na rota filha
        window.history.pushState({}, 'Test Page', '/admin');

        renderComponent();

        expect(screen.getByText('Conteúdo da Dashboard')).toBeInTheDocument();
    });

    // =========================================================================
    // 2. LÓGICA DE EFEITOS COLATERAIS (BODY CLASS)
    // =========================================================================

    it('Deve adicionar a classe "admin-body" ao body ao montar e remover ao desmontar', () => {
        const { unmount } = renderComponent();

        // Verifica se adicionou ao entrar
        expect(document.body.classList.contains('admin-body')).toBe(true);

        // Desmonta (simula sair da rota)
        unmount();

        // Verifica se removeu (Cleanup do useEffect)
        expect(document.body.classList.contains('admin-body')).toBe(false);
    });

    // =========================================================================
    // 3. INTERAÇÃO E SEGURANÇA (LOGOUT)
    // =========================================================================

    it('Deve realizar logout corretamente (Limpar storage e redirecionar)', () => {
        // Popula storage antes
        sessionStorage.setItem('token', '12345');
        sessionStorage.setItem('adminUser', '{"nome": "Admin"}');

        renderComponent();

        const btnSair = screen.getByText('🚪 Sair');
        fireEvent.click(btnSair);

        // 1. Storage deve estar limpo
        expect(sessionStorage.getItem('token')).toBeNull();
        expect(sessionStorage.getItem('adminUser')).toBeNull();

        // 2. Deve navegar para login com replace: true
        expect(mockedNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    // =========================================================================
    // 4. UNHAPPY PATH (ROBUSTEZ)
    // =========================================================================

    it('Não deve quebrar se o sessionStorage estiver vazio ou inválido', () => {
        // Cenário 1: Vazio
        sessionStorage.removeItem('adminUser');

        // Renderiza sem erros
        const { container } = renderComponent();

        // O nome deve estar vazio ou undefined, mas o componente montou
        expect(screen.getByText('Logado como:')).toBeInTheDocument();
        // Verifica se não crashou buscando algo dentro do strong
        const strongTag = container.querySelector('strong');
        expect(strongTag).toBeInTheDocument();
    });

    it('Deve lidar com JSON inválido no sessionStorage sem crashar', () => {
        sessionStorage.setItem('adminUser', 'Texto invalido não json');

        expect(() => renderComponent()).toThrow();
    });
});