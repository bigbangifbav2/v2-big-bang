import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
    children: React.ReactNode;
}

const RotaProtegida: React.FC<Props> = ({ children }) => {
    const token = sessionStorage.getItem('token');

    if (!token) {
        // Se não tem token, manda pro login
        return <Navigate to="/login" replace />;
    }

    // Se tem token, renderiza a página admin
    return <>{children}</>;
};

export default RotaProtegida;