import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import AdminParticipantesPage from './AdminParticipantesPage';
import toast from 'react-hot-toast';

// --- MOCKS GLOBAIS ---

// 1. Mock do Toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock do window.confirm
let confirmSpy: Mock;

// --- DADOS MOCKADOS ---
const mockParticipantes = [
    { codRanking: 101, usuario: 'Jogador 1', pontuacao: 100, nivel: 'INICIANTE' },
    { codRanking: 102, usuario: 'Jogador 2', pontuacao: 200, nivel: 'CURIOSO' },
    { codRanking: 103, usuario: 'Jogador 3', pontuacao: 300, nivel: 'CIENTISTA' },
];

const mockRespostaAPI = {
    data: mockParticipantes,
    total: 3,
    pagina: 1,
    totalPaginas: 2
};

// --- HELPERS ---

const setupSession = (podeExcluir: boolean) => {
    sessionStorage.setItem('token', 'fake-token');
    sessionStorage.setItem('adminUser', JSON.stringify({
        id: 1,
        isSuperAdmin: false,
        podeExcluirParticipantes: podeExcluir
    }));
};

describe('Página AdminParticipantesPage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();

        confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true) as unknown as Mock;
        vi.spyOn(console, 'error').mockImplementation(() => {});

        // Mock do Fetch Padrão (Sucesso na listagem)
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockRespostaAPI,
        });

        // Por padrão, tem permissão
        setupSession(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // 1. RENDERIZAÇÃO E PERMISSÕES
    // =========================================================================

    it('Deve renderizar a tabela com participantes carregados', async () => {
        render(<AdminParticipantesPage />);

        await waitFor(() => {
            expect(screen.getByText('Jogador 1')).toBeInTheDocument();
            expect(screen.getByText('INICIANTE')).toBeInTheDocument();
            expect(screen.getAllByRole('row')).toHaveLength(4); // 3 dados + 1 header
        });
    });

    it('Deve habilitar o botão Excluir se o usuário tiver permissão', async () => {
        setupSession(true);
        render(<AdminParticipantesPage />);

        await waitFor(() => screen.getByText('Jogador 1'));

        const btnsExcluir = screen.getAllByTitle('Excluir participante');
        btnsExcluir.forEach(btn => {
            expect(btn).not.toBeDisabled();
        });
    });

    it('Deve DESABILITAR o botão Excluir se o usuário NÃO tiver permissão', async () => {
        setupSession(false); // Sem permissão
        render(<AdminParticipantesPage />);

        await waitFor(() => screen.getByText('Jogador 1'));

        const btnsExcluir = screen.getAllByTitle('Sem permissão para excluir');
        btnsExcluir.forEach(btn => {
            expect(btn).toBeDisabled();
            expect(btn).toHaveStyle({ opacity: '0.5' });
        });
    });

    // =========================================================================
    // 2. HAPPY PATH (FUNCIONALIDADES - COM CORREÇÕES ASYNC)
    // =========================================================================

    it('Deve abrir o modal ao clicar em "Nome" e salvar a edição', async () => {
        // Configura mocks sequenciais
        (globalThis.fetch as Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI }) // 1. Lista
            .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }) // 2. Salvar
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI }); // 3. Recarregar

        render(<AdminParticipantesPage />);

        // Espera carregar a tabela
        await waitFor(() => screen.getByText('Jogador 1'));

        // 1. Clica em Editar
        const btnsEditar = screen.getAllByText('✏️ Nome');
        fireEvent.click(btnsEditar[0]);

        // 2. CORREÇÃO: Usa findByText para esperar o Modal aparecer (animação/state)
        const modalTitle = await screen.findByText('Editar: Jogador 1');
        expect(modalTitle).toBeInTheDocument();

        // 3. Interage com o Input Real
        const inputNome = screen.getByDisplayValue('Jogador 1');
        fireEvent.change(inputNome, { target: { value: 'Nome Editado' } });

        // 4. Clica em Salvar
        const btnSalvar = screen.getByText('Salvar Alterações');
        fireEvent.click(btnSalvar);

        // 5. Verifica se a API foi chamada
        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/participantes/101'),
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ nome: 'Nome Editado' })
                })
            );
            expect(toast.success).toHaveBeenCalledWith('Nome alterado para "Nome Editado"!');
        });
    });

    it('Deve paginar corretamente ao clicar em Próxima', async () => {
        render(<AdminParticipantesPage />);
        await waitFor(() => screen.getByText('Página 1 de 2'));

        const btnProxima = screen.getByText('Próxima');
        fireEvent.click(btnProxima);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('page=2'),
                expect.anything()
            );
        });
    });

    it('Deve excluir um participante após confirmação', async () => {
        (globalThis.fetch as Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI });

        confirmSpy.mockReturnValue(true);

        render(<AdminParticipantesPage />);
        await waitFor(() => screen.getByText('Jogador 2'));

        const btnsExcluir = screen.getAllByTitle('Excluir participante');
        fireEvent.click(btnsExcluir[1]);

        expect(confirmSpy).toHaveBeenCalled();

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/participantes/102'),
                expect.objectContaining({ method: 'DELETE' })
            );
            expect(toast.success).toHaveBeenCalledWith('Participante excluído!');
        });
    });

    // =========================================================================
    // 3. UNHAPPY PATH (ERROS - COM CORREÇÕES ASYNC)
    // =========================================================================

    it('Deve exibir mensagem de erro se a API falhar ao carregar lista', async () => {
        (globalThis.fetch as Mock).mockRejectedValue(new Error('Network Error'));

        render(<AdminParticipantesPage />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao carregar lista.');
        });
    });

    it('Deve exibir erro se falhar ao atualizar o nome', async () => {
        // 1. Carrega lista com sucesso
        (globalThis.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI });
        // 2. Falha ao Salvar (Erro 500)
        (globalThis.fetch as Mock).mockResolvedValueOnce({ ok: false, status: 500 });

        render(<AdminParticipantesPage />);
        await waitFor(() => screen.getByText('Jogador 1'));

        // Abre Modal
        fireEvent.click(screen.getAllByText('✏️ Nome')[0]);

        // CORREÇÃO: Espera o modal aparecer antes de clicar em salvar
        const btnSalvar = await screen.findByText('Salvar Alterações');
        fireEvent.click(btnSalvar);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar nome.');
        });
    });

    it('Não deve fazer nada se cancelar a exclusão', async () => {
        confirmSpy.mockReturnValue(false);

        render(<AdminParticipantesPage />);
        await waitFor(() => screen.getByText('Jogador 1'));

        fireEvent.click(screen.getAllByTitle('Excluir participante')[0]);

        // Garante que o DELETE não foi chamado
        expect(globalThis.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('DELETE'),
            expect.anything()
        );
    });

    it('Não deve tentar excluir se o botão estiver desabilitado (segurança extra)', async () => {
        setupSession(false);
        render(<AdminParticipantesPage />);

        await waitFor(() => screen.getByText('Jogador 1'));

        const btnBloqueado = screen.getAllByTitle('Sem permissão para excluir')[0];
        fireEvent.click(btnBloqueado);

        expect(confirmSpy).not.toHaveBeenCalled();
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
});