import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ActiveUserProvider } from "./context/ActiveUserContext";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./pages/Dashboard";
import { Usuarios } from "./pages/Usuarios";
import { Cursos } from "./pages/Cursos";
import { Trilhas } from "./pages/Trilhas";
import { SalaDeAula } from "./pages/SalaDeAula";
import { Financeiro } from "./pages/Financeiro";
import { Certificados } from "./pages/Certificados";

const App: React.FC = () => {
  return (
    <ActiveUserProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100 pb-5">
          <Navbar />
          <div className="flex-grow-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inicio" element={<Dashboard />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/trilhas" element={<Trilhas />} />
              <Route path="/sala-de-aula/:cursoId" element={<SalaDeAula />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/certificados" element={<Certificados />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ActiveUserProvider>
  );
};

export default App;
