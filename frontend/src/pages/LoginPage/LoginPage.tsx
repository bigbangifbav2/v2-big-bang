import React, { useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import '../../styles/styleLogin.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                navigate('/admin', { replace: true });
            } else {
                setErro(data.error || 'Erro ao fazer login');
            }
        } catch (error) {
            setErro('Erro de conexão com o servidor.');
        }
    };

    return (
        <div className="login-page-wrapper">

            {/* --- BOTÃO DE VOLTAR --- */}
            <Link to="/" className="btn-voltar-imagem-fixo">
                <img
                    src="/img/voltar.png"
                    alt="Voltar para o Início"
                    title="Voltar para o Início"
                />
            </Link>

            <div className="login-card">
                <h2 className="login-title">Admin Login</h2>

                {erro && <div className="error-msg">{erro}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>E-mail</label>
                        <input
                            type="email"
                            className="form-control-custom"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@exemplo.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            className="form-control-custom"
                            value={senha}
                            onChange={e => setSenha(e.target.value)}
                            placeholder="******"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-login">
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;