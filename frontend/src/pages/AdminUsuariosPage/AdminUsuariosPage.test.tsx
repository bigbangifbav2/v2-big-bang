import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminUsuariosPage from './AdminUsuariosPage';
import toast from 'react-hot-toast';

// --- MOCKS GLOBAIS ---
const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
    };
});

// Mock do Toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock do window.confirm
const confirmSpy = vi.spyOn(window, 'confirm');

// --- DADOS MOCKADOS ---
const mockUsuarios = [
    { id: 1, nome: 'Super Admin', email: 'super@admin.com', isSuperAdmin: true },
    { id: 2, nome: 'Admin Comum', email: 'admin@comum.com', isSuperAdmin: false },
    { id: 3, nome: 'Usuario Teste', email: 'teste@teste.com', isSuperAdmin: false },
];

const mockRespostaAPI = {
    data: mockUsuarios,
    total: 3,
    pagina: 1,
    totalPaginas: 1
};

// --- HELPERS ---

const setupSession = (isSuperAdmin: boolean, podeGerenciar: boolean, id = 1) => {
    sessionStorage.setItem('token', 'fake-token');
    sessionStorage.setItem('adminUser', JSON.stringify({
        id,
        nome: 'Tester',
        isSuperAdmin,
        podeGerenciarUsuarios: podeGerenciar
    }));
};

describe('Página AdminUsuariosPage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();

        // Configura Fake Timers para controlar o debounce de 500ms do useEffect
        vi.useFakeTimers({ shouldAdvanceTime: true });

        // Mock padrão do fetch
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockRespostaAPI,
        });

        // Configuração padrão de sessão: Super Admin
        setupSession(true, true);
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    const renderAndLoad = async () => {
        render(
            <BrowserRouter>
                <AdminUsuariosPage />
            </BrowserRouter>
        );

        // Avança 500ms para disparar o carregarUsuarios dentro do useEffect
        await act(async () => {
            vi.advanceTimersByTime(550);
        });
    };

    // =========================================================================
    // 1. TESTES DE RENDERIZAÇÃO E PERMISSÕES (VISUAL)
    // =========================================================================

    it('Deve renderizar a tabela com usuários carregados', async () => {
        await renderAndLoad();

        await waitFor(() => {
            // CORREÇÃO: Verifica se existe ALGUM elemento com o texto
            const elementosSuper = screen.getAllByText('Super Admin');
            expect(elementosSuper.length).toBeGreaterThan(0);

            expect(screen.getByText('Admin Comum')).toBeInTheDocument();
        });
    });

    it('Deve mostrar o botão "+ Novo Usuário" apenas se tiver permissão de gerenciar', async () => {
        // Caso 1: Com permissão
        await renderAndLoad();
        await waitFor(() => expect(screen.getByText('+ Novo Usuário')).toBeInTheDocument());

        // Limpa DOM para o próximo caso
        vi.runOnlyPendingTimers();
        document.body.innerHTML = '';

        // Caso 2: Sem permissão
        setupSession(false, false);
        await renderAndLoad();

        await waitFor(() => {
            expect(screen.queryByText('+ Novo Usuário')).not.toBeInTheDocument();
        });
    });

    it('Deve identificar o usuário logado com o badge "Você"', async () => {
        setupSession(false, true, 2); // Logado como ID 2 (Admin Comum)
        await renderAndLoad();

        await waitFor(() => {
            const row = screen.getByText('Admin Comum').closest('tr');
            expect(row).toHaveTextContent('Você');
        });
    });

    // =========================================================================
    // 2. HAPPY PATH (FUNCIONALIDADES)
    // =========================================================================

    it('Deve navegar para a página de edição ao clicar no botão Editar', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('Usuario Teste'));

        // Clica no editar do usuário 3 (índice 2 dos botões de editar)
        const btnsEditar = screen.getAllByTitle('Editar'); // Filtra apenas os habilitados/visíveis com esse title
        fireEvent.click(btnsEditar[2]);

        expect(mockedNavigate).toHaveBeenCalledWith('/admin/usuarios/editar/3');
    });

    it('Deve realizar busca ao digitar no campo de pesquisa', async () => {
        await renderAndLoad();

        const inputBusca = screen.getByPlaceholderText(/Buscar por nome/i);

        // Limpa o mock para verificar apenas a chamada da busca
        (globalThis.fetch as Mock).mockClear();
        // Recria a resposta padrão para a busca
        (globalThis.fetch as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockRespostaAPI,
        });

        fireEvent.change(inputBusca, { target: { value: 'Super' } });

        // Avança o tempo do debounce da busca (500ms)
        await act(async () => {
            vi.advanceTimersByTime(550);
        });

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('busca=Super'),
                expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } })
            );
        });
    });

    it('Deve deletar um usuário após confirmação e atualizar a lista', async () => {
        // Configura mocks sequenciais
        (globalThis.fetch as Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI }) // 1. Load inicial
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })            // 2. DELETE
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI });// 3. Reload lista

        confirmSpy.mockReturnValue(true);

        await renderAndLoad();
        await waitFor(() => screen.getByText('Usuario Teste'));

        const btnsExcluir = screen.getAllByTitle('Excluir');

        const btnExcluirAlvo = btnsExcluir[btnsExcluir.length - 1]; // Pega o último (Usuario Teste)
        fireEvent.click(btnExcluirAlvo);

        expect(confirmSpy).toHaveBeenCalled();

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/usuarios/3'),
                expect.objectContaining({ method: 'DELETE' })
            );
            expect(toast.success).toHaveBeenCalledWith('Usuário removido!');
        });
    });

    // =========================================================================
    // 3. UNHAPPY PATH (ERROS E PROTEÇÕES)
    // =========================================================================

    it('Deve exibir mensagem de erro se a API falhar ao carregar lista', async () => {
        // Mock de erro 500
        (globalThis.fetch as Mock).mockResolvedValue({
            ok: false,
            json: async () => ({})
        });

        await renderAndLoad();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao carregar lista.');
        });
    });

    it('Não deve permitir excluir a si mesmo ou um Super Admin (botão desabilitado)', async () => {
        setupSession(false, true, 2); // Admin Comum (ID 2)
        await renderAndLoad();

        // Usar getAllByText e pegar o primeiro (qualquer um serve para provar que carregou)
        await waitFor(() => {
            expect(screen.getAllByText('Super Admin').length).toBeGreaterThan(0);
        });

        // Busca todos os botões que parecem ser de exclusão (habilitados ou não)
        const allDeleteButtons = screen.getAllByText('🗑️ Excluir');

        // Índice 0: Super Admin (Eu sou comum -> não posso excluir super)
        expect(allDeleteButtons[0]).toBeDisabled();

        // Índice 1: Admin Comum (Sou eu -> não posso me excluir)
        expect(allDeleteButtons[1]).toBeDisabled();

        // Índice 2: Usuario Teste (Posso excluir)
        expect(allDeleteButtons[2]).not.toBeDisabled();
    });

    it('Não deve permitir editar um Super Admin se o logado não for Super Admin', async () => {
        setupSession(false, true, 2);
        await renderAndLoad();

        // Usar getAllByText
        await waitFor(() => {
            expect(screen.getAllByText('Super Admin').length).toBeGreaterThan(0);
        });

        const allEditButtons = screen.getAllByText('✏️ Editar');

        // Índice 0: Super Admin -> Bloqueado
        expect(allEditButtons[0]).toBeDisabled();

        // Índice 2: Usuario Teste -> Liberado
        expect(allEditButtons[2]).not.toBeDisabled();
    });

    it('Deve exibir erro se falhar ao excluir usuário', async () => {
        // 1. Load com sucesso
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockRespostaAPI
        });

        // 2. Erro no DELETE
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Falha crítica' })
        });

        confirmSpy.mockReturnValue(true);

        await renderAndLoad();
        await waitFor(() => screen.getByText('Usuario Teste'));

        const btnsExcluir = screen.getAllByText('🗑️ Excluir');
        const alvo = btnsExcluir[btnsExcluir.length - 1]; // Usuario Teste

        fireEvent.click(alvo);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Falha crítica');
        });
    });

    it('Não deve fazer nada se o usuário cancelar a exclusão no confirm', async () => {
        confirmSpy.mockReturnValue(false); // Cancelar

        await renderAndLoad();
        await waitFor(() => screen.getByText('Usuario Teste'));

        const btnsExcluir = screen.getAllByText('🗑️ Excluir');
        const alvo = btnsExcluir[btnsExcluir.length - 1];

        fireEvent.click(alvo);

        // Verifica se NÃO chamou DELETE
        expect(globalThis.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('DELETE'),
            expect.anything()
        );
    });
});