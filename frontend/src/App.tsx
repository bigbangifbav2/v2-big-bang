import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import RankingPage from './pages/RankingPage/RankingPage';
import NiveisPage from './pages/NiveisPage/NiveisPage';
import SelecaoPerfilPage from './pages/SelecaoPerfilPage/SelecaoPerfilPage';
import JogoPage from './pages/JogoPage/JogoPage';
import LoginPage from "./pages/LoginPage/LoginPage.tsx";
import RotaProtegida from "./components/RotaProtegida/RotaProtegida.tsx";
import AdminElementosPage from "./pages/AdminElementosPage/AdminElementosPage.tsx";
import AdminElementoForm from "./pages/AdminElementoForm/AdminElementoForm.tsx";
import AdminParticipantesPage from "./pages/AdminParticipantesPage/AdminParticipantesPage.tsx";
import AdminLayout from "./components/AdminLayout/AdminLayout.tsx";
import AdminWelcome from "./components/AdminWelcome/AdminWelcome.tsx";
import {Toaster} from "react-hot-toast";
import AdminUsuariosPage from "./pages/AdminUsuariosPage/AdminUsuariosPage.tsx";
import AdminUsuarioForm from "./pages/AdminUsuarioForm/AdminUsuarioForm.tsx";
import Creditos from './pages/CreditosPage/Creditos.tsx'; // <--- IMPORTAR
import Tutorial from './pages/TutorialPage/Tutorial.tsx';
import "primereact/resources/themes/lara-light-cyan/theme.css"; // Tema (pode trocar 'lara-light-cyan' por outros)
import "primereact/resources/primereact.min.css";              // Core CSS
import "primeicons/primeicons.css";

const App: React.FC = () => {
  return (
    // Usa o Router para habilitar a navegação
    <Router>
      <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            // Você pode definir estilos padrão para combinar com seu tema Dark
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: 'green',
              },
            },
            error: {
              style: {
                background: 'red',
              },
            },
          }}
      />

      <Routes>
        {/* Rota principal: usa o componente Home que criaremos */}
        <Route path="/" element={<Home />} />

        {/* Rota Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas secundárias que consumir a API */}
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/niveis" element={<NiveisPage />} />
        <Route path="/jogo/selecao-perfil/:codNivel" element={<SelecaoPerfilPage />} />
        <Route path="/jogo/:codNivel" element={<JogoPage />} />

        {/*/!* Rotas Privadas (Agrupadas) *!/*/}
        {/*<Route path="/admin/elementos" element={*/}
        {/*  <RotaProtegida>*/}
        {/*    <AdminElementosPage />*/}
        {/*  </RotaProtegida>*/}
        {/*} />*/}

        {/*<Route path="/admin/elementos/novo" element={*/}
        {/*  <RotaProtegida>*/}
        {/*    <AdminElementoForm />*/}
        {/*  </RotaProtegida>*/}
        {/*} />*/}

        {/*<Route path="/admin/elementos/editar/:id" element={*/}
        {/*  <RotaProtegida>*/}
        {/*    <AdminElementoForm />*/}
        {/*  </RotaProtegida>*/}
        {/*} />*/}

        {/*<Route path="/admin/participantes" element={*/}
        {/*  <RotaProtegida>*/}
        {/*    <AdminParticipantesPage />*/}
        {/*  </RotaProtegida>*/}
        {/*} />*/}
        {/* GRUPO DE ROTAS ADMIN */}
        {/* Rota Pai: Protegida e usa o Layout */}
        <Route path="/admin" element={
          <RotaProtegida>
            <AdminLayout />
          </RotaProtegida>
        }>
          {/* Rota Index: Quando acessar /admin, mostra o Welcome */}
          <Route index element={<AdminWelcome />} />

          {/* Rotas Filhas: Renderizam dentro do <Outlet /> do Layout */}
          <Route path="elementos" element={<AdminElementosPage />} />
          <Route path="elementos/novo" element={<AdminElementoForm />} />
          <Route path="elementos/editar/:id" element={<AdminElementoForm />} />

          <Route path="participantes" element={<AdminParticipantesPage />} />

            <Route path="usuarios" element={<AdminUsuariosPage />} />
            <Route path="usuarios/novo" element={<AdminUsuarioForm />} />
            <Route path="usuarios/editar/:id" element={<AdminUsuarioForm />} />
        </Route>

        {/* Rotas simples do sistema legado */}
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/creditos" element={<Creditos />} />
      </Routes>
    </Router>
  );
};

export default App;