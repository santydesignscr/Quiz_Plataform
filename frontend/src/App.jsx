import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Quiz from './components/Quiz';  // Componente de Quiz
import UploadQuizForm from './components/UploadQuizForm';  // Componente de subir quiz
import SearchQuizzes from './components/SearchQuizzes';  // Componente para buscar quizzes

function NotFound() {
  return <h1>404 - Página no encontrada</h1>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchQuizzes />} />  {/* Página de búsqueda */}
        <Route path="/quiz/:quizId" element={<Quiz />} />  {/* Quiz por URL */}
        <Route path="/upload" element={<UploadQuizForm />} />  {/* Formulario de carga */}
        <Route path="*" element={<NotFound />} />  {/* Página no encontrada */}
      </Routes>
    </Router>
  );
}

export default App;
