import React from 'react';
import { useNavigate} from 'react-router-dom';

const AdminHeader: React.FC = () => {
    const navigate = useNavigate();

    // Recupera o nome do usuário salvo para mostrar na tela
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const handleLogout = () => {
        // 1. Remove o token e os dados do usuário
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');

        // 2. Redireciona para o login
        navigate('/login', {replace: true});
    };

    return (
        <header className="bg-dark text-white p-3 mb-4 shadow-sm">
            <div className="container d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <h4 className="m-0 me-3">Painel Admin</h4>
                    <span className="badge bg-secondary">Olá, {adminUser.nome || 'Admin'}</span>
                </div>

                <div className="d-flex gap-2">
                    <button className="btn btn-outline-light btn-sm" onClick={() => navigate('/admin/elementos')}>
                        Elementos
                    </button>
                    <button className="btn btn-outline-light btn-sm" onClick={() => navigate('/admin/participantes')}>
                        Participantes
                    </button>
                    <button className="btn btn-danger btn-sm ms-3" onClick={handleLogout}>
                        Sair 🚪
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;