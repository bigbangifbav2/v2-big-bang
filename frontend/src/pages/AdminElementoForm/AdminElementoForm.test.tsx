import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminElementoForm from './AdminElementoForm';
import toast from 'react-hot-toast';

// --- CONFIGURAÇÃO DOS MOCKS ---

// 1. Mock do React Router
const mockedNavigate = vi.fn();
const mockedParams = { id: undefined as string | undefined };

vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
        useParams: () => mockedParams,
    };
});

// 2. Mock do Axios (USANDO VI.HOISTED)
const mockApi = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
}));

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mockApi),
    },
}));

// 3. Mock do Toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// 4. Mock de URL.createObjectURL para preview de imagem
globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');

// --- DADOS MOCKADOS ---
const mockElementoExistente = {
    nome: 'Oxigênio',
    simbolo: 'O',
    nivel: 1,
    dicas: ['É um gás', 'Essencial para vida', 'Combustão'],
    imagemUrl: '/img/o.png',
    imgDistribuicao: '/img/dist/o.png'
};

describe('Página AdminElementoForm', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockedParams.id = undefined;
        sessionStorage.setItem('token', 'fake-token');
        // Setup de Timers para o setTimeout do navigate
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
        sessionStorage.clear();
    });

    const renderComponent = () => render(
        <BrowserRouter>
            <AdminElementoForm />
        </BrowserRouter>
    );

    // =========================================================================
    // 1. RENDERIZAÇÃO E ESTADOS INICIAIS
    // =========================================================================

    it('Deve renderizar formulário vazio no modo "Novo Elemento"', () => {
        mockedParams.id = undefined;
        renderComponent();

        expect(screen.getByText('Novo Elemento')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: Hidrogênio')).toHaveValue('');
        expect(screen.getByPlaceholderText('H')).toHaveValue('');

        // Verifica se os campos de dica estão vazios
        const inputsDica = screen.getAllByPlaceholderText(/Insira a dica/);
        expect(inputsDica).toHaveLength(3);
        expect(inputsDica[0]).toHaveValue('');
    });

    it('Deve exibir o campo "Cerne do Gás Nobre" apenas se Nível for 1', async () => {
        const { container } = renderComponent(); // Usamos container para buscar seletor CSS se necessário

        // Padrão é nível 1
        expect(screen.getByText('Cerne do Gás Nobre')).toBeInTheDocument();

        const selectNivel = container.querySelector('select.form-select');

        if (!selectNivel) throw new Error("Select de nível não encontrado");

        fireEvent.change(selectNivel, { target: { value: '2' } });

        // Deve desaparecer
        await waitFor(() => {
            expect(screen.queryByText('Cerne do Gás Nobre')).not.toBeInTheDocument();
        });
    });

    it('Deve carregar dados e preencher formulário no modo "Editar"', async () => {
        mockedParams.id = '8';
        mockApi.get.mockResolvedValueOnce({ data: mockElementoExistente });

        renderComponent();

        expect(screen.getByText(/Editar:/)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Oxigênio')).toBeInTheDocument();
            expect(screen.getByDisplayValue('O')).toBeInTheDocument();
            // Verifica dicas
            expect(screen.getByDisplayValue('É um gás')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // 2. HAPPY PATH (INTERAÇÕES E UPLOAD)
    // =========================================================================

    it('Deve mostrar preview ao selecionar uma imagem principal', async () => {
        renderComponent();

        const file = new File(['(⌐□_□)'], 'elemento.png', { type: 'image/png' });


        const label = screen.getByText('Imagem do Elemento');
        const container = label.parentElement;
        const inputFile = container?.querySelector('input[type="file"]');

        if (!inputFile) throw new Error("Input file não encontrado");

        fireEvent.change(inputFile, { target: { files: [file] } });

        await waitFor(() => {
            expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(file);
            const imgPreview = screen.getByAltText('Preview');
            expect(imgPreview).toHaveAttribute('src', 'blob:fake-url');
        });
    });

    it('Deve criar um NOVO elemento com sucesso (POST com FormData)', async () => {
        mockedParams.id = undefined;
        mockApi.post.mockResolvedValueOnce({ data: { success: true } });

        renderComponent();

        // Preenche campos
        fireEvent.change(screen.getByPlaceholderText('Ex: Hidrogênio'), { target: { value: 'Ferro' } });
        fireEvent.change(screen.getByPlaceholderText('H'), { target: { value: 'Fe' } });

        // Preenche Dicas
        const inputsDica = screen.getAllByPlaceholderText(/Insira a dica/);
        fireEvent.change(inputsDica[0], { target: { value: 'Metal' } });
        fireEvent.change(inputsDica[1], { target: { value: 'Magnético' } });
        fireEvent.change(inputsDica[2], { target: { value: 'Hematita' } });

        // Salvar
        const btnSalvar = screen.getByText('Salvar Alterações');
        fireEvent.click(btnSalvar);

        await waitFor(() => {
            expect(mockApi.post).toHaveBeenCalledWith('/elementos', expect.any(FormData), expect.anything());
            expect(toast.success).toHaveBeenCalledWith('Elemento criado com sucesso!');
        });

        act(() => { vi.advanceTimersByTime(500); });
        expect(mockedNavigate).toHaveBeenCalledWith('/admin/elementos');
    });

    it('Deve atualizar um elemento EXISTENTE com sucesso (PUT)', async () => {
        mockedParams.id = '8';
        mockApi.get.mockResolvedValueOnce({ data: mockElementoExistente });
        mockApi.put.mockResolvedValueOnce({ data: { success: true } });

        renderComponent();
        await waitFor(() => screen.getByDisplayValue('Oxigênio'));

        fireEvent.change(screen.getByDisplayValue('Oxigênio'), { target: { value: 'Oxigênio Editado' } });

        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(mockApi.put).toHaveBeenCalledWith('/elementos/8', expect.any(FormData), expect.anything());
            expect(toast.success).toHaveBeenCalledWith('Elemento editado com sucesso!');
        });
    });

    // =========================================================================
    // 3. UNHAPPY PATH (ERROS E VALIDAÇÕES)
    // =========================================================================

    it('Deve impedir envio se campos obrigatórios estiverem vazios', () => {
        renderComponent();

        const btnSalvar = screen.getByText('Salvar Alterações');
        fireEvent.click(btnSalvar);

        expect(toast.error).toHaveBeenCalledWith('Preencha Nome e Símbolo.');
        expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('Deve impedir envio se as dicas não estiverem completas', () => {
        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Ex: Hidrogênio'), { target: { value: 'Ferro' } });
        fireEvent.change(screen.getByPlaceholderText('H'), { target: { value: 'Fe' } });

        const inputsDica = screen.getAllByPlaceholderText(/Insira a dica/);
        fireEvent.change(inputsDica[0], { target: { value: 'Metal' } });

        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(toast.error).toHaveBeenCalledWith('Preencha as 3 dicas.');
        expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('Deve exibir erro se falhar ao carregar dados na edição', async () => {
        mockedParams.id = '999';
        mockApi.get.mockRejectedValueOnce(new Error('Network Error'));

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Erro ao carregar elemento.')).toBeInTheDocument();
        });
    });

    it('Deve lidar com erro 401 (Sessão Expirada) ao salvar', async () => {
        mockedParams.id = undefined;
        // Mock de erro 401 do Axios
        mockApi.post.mockRejectedValueOnce({
            response: { status: 401 }
        });

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Ex: Hidrogênio'), { target: { value: 'X' } });
        fireEvent.change(screen.getByPlaceholderText('H'), { target: { value: 'X' } });
        const inputsDica = screen.getAllByPlaceholderText(/Insira a dica/);
        inputsDica.forEach(input => fireEvent.change(input, { target: { value: 'Dica' } }));

        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Sessão expirada.");
            expect(mockedNavigate).toHaveBeenCalledWith('/login');
        });
    });

    it('Deve exibir mensagem de erro genérica se o salvamento falhar', async () => {
        mockedParams.id = undefined;
        mockApi.post.mockRejectedValueOnce(new Error('Erro Desconhecido'));

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Ex: Hidrogênio'), { target: { value: 'X' } });
        fireEvent.change(screen.getByPlaceholderText('H'), { target: { value: 'X' } });
        const inputsDica = screen.getAllByPlaceholderText(/Insira a dica/);
        inputsDica.forEach(input => fireEvent.change(input, { target: { value: 'Dica' } }));

        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro ao salvar.');
        });
    });
});