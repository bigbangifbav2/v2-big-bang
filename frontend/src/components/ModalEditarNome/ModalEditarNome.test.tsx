import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModalEditarNome from './ModalEditarNome';

describe('Componente ModalEditarNome', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    const propsPadrao = {
        isOpen: true,
        titulo: 'Editar Jogador',
        valorInicial: 'João da Silva',
        onClose: mockOnClose,
        onSave: mockOnSave
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Não deve renderizar nada se isOpen for false', () => {
        const { container } = render(<ModalEditarNome {...propsPadrao} isOpen={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Deve renderizar corretamente quando isOpen for true', () => {
        render(<ModalEditarNome {...propsPadrao} />);
        expect(screen.getByText('Editar Jogador')).toBeInTheDocument();
        expect(screen.getByDisplayValue('João da Silva')).toBeInTheDocument();
    });

    it('Deve atualizar o valor do input ao digitar', () => {
        render(<ModalEditarNome {...propsPadrao} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Maria Souza' } });
        expect(input).toHaveValue('Maria Souza');
    });

    it('Deve chamar onSave com o NOVO valor ao clicar em Salvar', () => {
        render(<ModalEditarNome {...propsPadrao} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Nome Editado' } });
        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith('Nome Editado');
    });

    it('Deve chamar onClose ao clicar em Cancelar', () => {
        render(<ModalEditarNome {...propsPadrao} />);
        fireEvent.click(screen.getByText('Cancelar'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('Deve salvar ao pressionar a tecla ENTER no input', () => {
        render(<ModalEditarNome {...propsPadrao} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'SalvarEnter' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

        expect(mockOnSave).toHaveBeenCalledWith('SalvarEnter');
    });
});
