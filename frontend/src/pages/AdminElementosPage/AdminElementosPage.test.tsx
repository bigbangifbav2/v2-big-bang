import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminElementosPage from './AdminElementosPage';
import toast from 'react-hot-toast';

// --- MOCKS GLOBAIS ---

// 1. Mock do React Router
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
    };
});

// 2. Mock do Toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock do window.confirm
const confirmSpy = vi.spyOn(window, 'confirm');

// --- DADOS MOCKADOS ---
const mockElementos = [
    { id: 1, nome: 'Hidrogênio', simbolo: 'H', codNivel: 1 },
    { id: 2, nome: 'Hélio', simbolo: 'He', codNivel: 2 },
    { id: 3, nome: 'Lítio', simbolo: 'Li', codNivel: 3 },
];

const mockRespostaAPI = {
    data: mockElementos,
    total: 3,
    pagina: 1,
    totalPaginas: 2 // Para testar paginação
};

// --- HELPERS ---

const setupSession = (podeExcluir: boolean) => {
    sessionStorage.setItem('token', 'fake-token');
    sessionStorage.setItem('adminUser', JSON.stringify({
        id: 1,
        isSuperAdmin: false,
        podeExcluirElementos: podeExcluir
    }));
};

describe('Página AdminElementosPage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();

        // Mock do Fetch Padrão
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockRespostaAPI,
        });

        // Configuração de Timer Falso (necessário por causa do debounce no useEffect)
        vi.useFakeTimers({ shouldAdvanceTime: true });

        // Sessão padrão: Com permissão
        setupSession(true);
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    /**
     * Helper para renderizar e avançar o tempo (debounce inicial)
     */
    const renderAndLoad = async () => {
        render(
            <BrowserRouter>
                <AdminElementosPage />
            </BrowserRouter>
        );
        // Avança 500ms para disparar o carregarElementos
        await act(async () => {
            vi.advanceTimersByTime(550);
        });
    };

    // =========================================================================
    // 1. RENDERIZAÇÃO E PERMISSÕES
    // =========================================================================

    it('Deve renderizar a tabela com elementos carregados', async () => {
        await renderAndLoad();

        await waitFor(() => {
            expect(screen.getByText('Hidrogênio')).toBeInTheDocument();
            expect(screen.getByText('Hélio')).toBeInTheDocument();
            expect(screen.getByText('INICIANTE')).toBeInTheDocument(); // Nível 1
            expect(screen.getByText('CURIOSO')).toBeInTheDocument();   // Nível 2
        });
    });

    it('Deve habilitar o botão Excluir se o usuário tiver permissão', async () => {
        setupSession(true);
        await renderAndLoad();

        await waitFor(() => screen.getByText('Hidrogênio'));

        const btnsExcluir = screen.getAllByTitle('Excluir elemento');
        btnsExcluir.forEach(btn => {
            expect(btn).not.toBeDisabled();
        });
    });

    it('Deve DESABILITAR o botão Excluir se o usuário NÃO tiver permissão', async () => {
        setupSession(false); // Sem permissão
        await renderAndLoad();

        await waitFor(() => screen.getByText('Hidrogênio'));

        const btnsExcluir = screen.getAllByTitle('Sem permissão para excluir');
        btnsExcluir.forEach(btn => {
            expect(btn).toBeDisabled();
            expect(btn).toHaveStyle({ opacity: '0.5' });
        });
    });

    it('Deve navegar para criar novo elemento ao clicar no botão', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('+ Novo Elemento'));

        fireEvent.click(screen.getByText('+ Novo Elemento'));
        expect(mockedNavigate).toHaveBeenCalledWith('/admin/elementos/novo');
    });

    // =========================================================================
    // 2. HAPPY PATH (FUNCIONALIDADES)
    // =========================================================================

    it('Deve navegar para edição ao clicar em Editar', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('Hidrogênio'));

        // Clica no editar do primeiro elemento (id 1)
        const btnsEditar = screen.getAllByText('✏️ Editar');
        fireEvent.click(btnsEditar[0]);

        expect(mockedNavigate).toHaveBeenCalledWith('/admin/elementos/editar/1');
    });

    it('Deve realizar busca ao digitar no campo (com debounce)', async () => {
        await renderAndLoad();

        const inputBusca = screen.getByPlaceholderText('🔍 Buscar elemento...');

        // Limpa mocks anteriores para testar só a busca
        (globalThis.fetch as Mock).mockClear();
        (globalThis.fetch as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockRespostaAPI
        });

        fireEvent.change(inputBusca, { target: { value: 'Helio' } });

        // Avança o debounce
        await act(async () => {
            vi.advanceTimersByTime(550);
        });

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('busca=Helio'),
                expect.anything()
            );
        });
    });

    it('Deve paginar corretamente ao clicar em Próxima', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('Página 1 de 2'));

        const btnProxima = screen.getByText('Próxima');
        fireEvent.click(btnProxima);

        // Avança o debounce (o useEffect depende de paginaAtual também)
        await act(async () => {
            vi.advanceTimersByTime(550);
        });

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('page=2'),
                expect.anything()
            );
        });
    });

    it('Deve excluir um elemento após confirmação', async () => {
        // Mock DELETE sequencial
        (globalThis.fetch as Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI }) // Load inicial
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })            // Delete
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI });// Reload

        confirmSpy.mockReturnValue(true); // Confirma

        await renderAndLoad();
        await waitFor(() => screen.getByText('Hidrogênio'));

        const btnsExcluir = screen.getAllByTitle('Excluir elemento');
        fireEvent.click(btnsExcluir[0]); // Excluir Hidrogênio (ID 1)

        expect(confirmSpy).toHaveBeenCalled();

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/elementos/1'),
                expect.objectContaining({ method: 'DELETE' })
            );
            expect(toast.success).toHaveBeenCalledWith('Excluído com sucesso!');
        });
    });

    // =========================================================================
    // 3. UNHAPPY PATH (ERROS)
    // =========================================================================

    it('Deve exibir mensagem de erro se a API falhar ao carregar lista', async () => {
        (globalThis.fetch as Mock).mockResolvedValue({
            ok: false,
            json: async () => ({})
        });

        await renderAndLoad();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao carregar elementos.');
        });
    });

    it('Deve exibir erro se falhar ao excluir elemento', async () => {
        // 1. Load OK
        (globalThis.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI });
        // 2. Delete Falha
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Elemento em uso' })
        });

        confirmSpy.mockReturnValue(true);

        await renderAndLoad();
        await waitFor(() => screen.getByText('Hidrogênio'));

        const btnsExcluir = screen.getAllByTitle('Excluir elemento');
        fireEvent.click(btnsExcluir[0]);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Elemento em uso');
        });
    });

    it('Não deve fazer nada se cancelar a exclusão', async () => {
        confirmSpy.mockReturnValue(false); // Cancelar

        await renderAndLoad();
        await waitFor(() => screen.getByText('Hidrogênio'));

        const btnsExcluir = screen.getAllByTitle('Excluir elemento');
        fireEvent.click(btnsExcluir[0]);

        // Verifica se NÃO chamou DELETE
        expect(globalThis.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('DELETE'),
            expect.anything()
        );
    });

    it('Não deve tentar excluir se o botão estiver desabilitado', async () => {
        setupSession(false); // Sem permissão
        await renderAndLoad();

        await waitFor(() => screen.getByText('Hidrogênio'));

        const btnBloqueado = screen.getAllByTitle('Sem permissão para excluir')[0];

        fireEvent.click(btnBloqueado);

        expect(confirmSpy).not.toHaveBeenCalled();
        // Apenas o GET inicial foi chamado
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
});