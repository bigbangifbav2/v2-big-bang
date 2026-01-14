// src/pages/AdminLayout/AdminLayout.tsx

import React, {useEffect} from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import '../../styles/styleAdmin.css';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();

    // Pega o nome do usuário
    const adminUser = JSON.parse(sessionStorage.getItem('adminUser') || '{}');

    useEffect(() => {
        // Adiciona a classe ao body ao entrar no Admin
        document.body.classList.add('admin-body');

        // Remove a classe ao sair do Admin (cleanup)
        return () => {
            document.body.classList.remove('admin-body');
        };
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('adminUser');
        navigate('/login', { replace: true });
    };

    return (
        <div className="admin-layout">
            {/* --- SIDEBAR ESQUERDA --- */}
            <aside className="admin-sidebar">
                <div className="sidebar-brand">
                    <span>BigBang Admin</span>
                </div>

                <nav className="sidebar-menu">
                    {/* NavLink coloca a classe 'active' automaticamente se a rota coincidir */}
                    <NavLink to="/admin" end replace className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span>Início</span>
                    </NavLink>

                    <NavLink to="/admin/elementos" replace className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span>Elementos</span>
                    </NavLink>

                    <NavLink to="/admin/participantes" replace className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span>Participantes</span>
                    </NavLink>

                    <NavLink to="/admin/usuarios" replace className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span>Usuários</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="mb-3 text-center text-muted small text-white">
                        Logado como: <strong>{adminUser.nome}</strong>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        🚪 Sair
                    </button>
                </div>
            </aside>

            {/* --- CONTEÚDO PRINCIPAL (Muda conforme a rota) --- */}
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;