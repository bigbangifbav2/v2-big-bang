// src/components/ModalEditarNome.tsx
import React, { useState, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    titulo: string;
    valorInicial: string;
    onClose: () => void;
    onSave: (novoValor: string) => void;
}

const ModalEditarNome: React.FC<ModalProps> = ({ isOpen, titulo, valorInicial, onClose, onSave }) => {
    const [valor, setValor] = useState(valorInicial);

    useEffect(() => {
        setValor(valorInicial);
    }, [valorInicial, isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="card bg-dark text-white border-secondary" style={{ width: '400px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                <div className="card-header border-secondary">
                    <h5 className="mb-0">{titulo}</h5>
                </div>
                <div className="card-body">
                    <label className="form-label text-muted small">Nome</label>
                    <input
                        type="text"
                        className="form-control form-control-lg bg-secondary text-white border-0"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && onSave(valor)}
                    />
                </div>
                <div className="card-footer border-secondary d-flex justify-content-end gap-2">
                    <button className="btn btn-outline-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn btn-success" onClick={() => onSave(valor)}>
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalEditarNome;