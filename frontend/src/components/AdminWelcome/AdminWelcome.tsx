// src/pages/AdminWelcome/AdminWelcome.tsx

import React from 'react';

const AdminWelcome: React.FC = () => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    return (
        <div className="welcome-container">
            <div className="welcome-card">
                <h1>Bem-vindo(a), {adminUser.nome || 'Admin'}! 👋</h1>
                <p className="lead mt-3">
                    Este é o painel de controle do <strong>BigBang Quiz</strong>.
                </p>
                <hr style={{ borderColor: 'white' }} />
                <p>Utilize o menu lateral para gerenciar os elementos do jogo ou visualizar os participantes.</p>
            </div>
        </div>
    );
};

export default AdminWelcome;