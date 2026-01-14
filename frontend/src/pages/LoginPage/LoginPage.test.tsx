import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

// --- MOCKS ---

const mockedNavigate = vi.fn();

// 1. Mock do React Router
vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
    };
});

describe('Página LoginPage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();

        // Mock padrão do fetch (pode ser sobrescrito em cada teste)
        globalThis.fetch = vi.fn();
    });

    const renderPage = () => {
        return render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );
    };

    // =========================================================================
    // 1. TESTES DE RENDERIZAÇÃO
    // =========================================================================

    it('Deve renderizar o formulário de login corretamente', () => {
        renderPage();

        expect(screen.getByText('Admin Login')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('admin@exemplo.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('******')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
    });

    it('Deve renderizar o botão de voltar para a home', () => {
        renderPage();

        const linkVoltar = screen.getByTitle('Voltar para o Início').closest('a');
        expect(linkVoltar).toBeInTheDocument();
        expect(linkVoltar).toHaveAttribute('href', '/');
    });

    // =========================================================================
    // 2. HAPPY PATH (CAMINHO FELIZ - SUCESSO)
    // =========================================================================

    it('Deve realizar login com sucesso, salvar token e redirecionar', async () => {
        // 1. Configura Mock de Sucesso da API
        const mockResponse = {
            token: 'fake-jwt-token',
            user: { id: 1, name: 'Admin' }
        };

        (globalThis.fetch as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        renderPage();

        // 2. Preenche o formulário
        fireEvent.change(screen.getByPlaceholderText('admin@exemplo.com'), { target: { value: 'admin@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: '123456' } });

        // 3. Submete
        const btnEntrar = screen.getByRole('button', { name: /Entrar/i });
        fireEvent.click(btnEntrar);

        // 4. Verificações
        await waitFor(() => {
            // A API foi chamada corretamente?
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/login'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ email: 'admin@test.com', senha: '123456' })
                })
            );

            // Salvou no SessionStorage?
            expect(sessionStorage.getItem('token')).toBe('fake-jwt-token');
            expect(sessionStorage.getItem('adminUser')).toContain('Admin');

            // Navegou para /admin?
            expect(mockedNavigate).toHaveBeenCalledWith('/admin', { replace: true });
        });
    });

    // =========================================================================
    // 3. UNHAPPY PATH (CENÁRIOS DE ERRO)
    // =========================================================================

    it('Deve exibir mensagem de erro se as credenciais forem inválidas', async () => {
        // 1. Configura Mock de Erro da API (ex: 401 Unauthorized)
        (globalThis.fetch as Mock).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Usuário ou senha inválidos' }),
        });

        renderPage();

        // 2. Preenche e Submete
        fireEvent.change(screen.getByPlaceholderText('admin@exemplo.com'), { target: { value: 'errado@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: 'senhaerrada' } });
        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

        // 3. Verificações
        await waitFor(() => {
            // Verifica se a mensagem de erro apareceu na tela
            expect(screen.getByText('Usuário ou senha inválidos')).toBeInTheDocument();

            // Garante que NÃO navegou e NÃO salvou token
            expect(mockedNavigate).not.toHaveBeenCalled();
            expect(sessionStorage.getItem('token')).toBeNull();
        });
    });

    it('Deve exibir erro genérico se a API retornar erro sem mensagem específica', async () => {
        // Mock de erro sem campo "error" no JSON
        (globalThis.fetch as Mock).mockResolvedValue({
            ok: false,
            json: async () => ({}), // JSON vazio
        });

        renderPage();

        fireEvent.change(screen.getByPlaceholderText('admin@exemplo.com'), { target: { value: 'a@a.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: '123' } });
        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

        await waitFor(() => {
            // Deve cair no fallback "Erro ao fazer login"
            expect(screen.getByText('Erro ao fazer login')).toBeInTheDocument();
        });
    });

    it('Deve exibir erro de conexão se o fetch falhar (ex: servidor offline)', async () => {
        // 1. Configura Mock para lançar exceção (Network Error)
        (globalThis.fetch as Mock).mockRejectedValue(new Error('Network Error'));

        renderPage();

        // 2. Preenche e Submete
        fireEvent.change(screen.getByPlaceholderText('admin@exemplo.com'), { target: { value: 'admin@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: '123' } });
        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

        // 3. Verificações
        await waitFor(() => {
            // Verifica a mensagem do bloco catch do componente
            expect(screen.getByText('Erro de conexão com o servidor.')).toBeInTheDocument();
        });
    });

    it('Não deve submeter se os campos estiverem vazios (Validação HTML)', () => {
        // Nota: O JSDOM (ambiente de teste) não bloqueia submit nativo de HTML 'required'
        // da mesma forma que o browser, mas podemos verificar se os atributos estão lá.
        renderPage();

        const inputEmail = screen.getByPlaceholderText('admin@exemplo.com');
        const inputSenha = screen.getByPlaceholderText('******');

        expect(inputEmail).toBeRequired();
        expect(inputSenha).toBeRequired();
    });
});