import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from "lucide-react";
import UploadQuizForm from './UploadQuizForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SearchQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("title");
  const [IsAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchByChange = (e) => {
    setSearchBy(e.target.value);
  };

  const fetchQuizzes = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`${API_URL}/api/search-quizzes?searchBy=${searchBy}&query=${searchQuery}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error desconocido al cargar el quiz.");
      }

      const data = await response.json();
      setQuizzes(data);
    } catch (err) {
      if (err.name === "TypeError" && err.message.includes("Failed to fetch")) {
        setError("Error al intentar conectar con el servidor. Verifica tu conexión a internet.");
      } 

      else if (err.message.includes("Error desconocido")) {
        setError("Hubo un error al cargar los quizes. Inténtalo nuevamente más tarde.");
      } 
      
      else {
        setError(err.message || "Error inesperado al cargar los quizes.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [searchQuery, searchBy]);

  const handleQuizClick = (quizId) => {
    window.open(`/quiz/${quizId}`, '_blank');
  };

  const goToUploadQuiz = () => {
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Search Bar */}
        <div className="flex flex-wrap gap-4">
          <Input
            type="text"
            placeholder={
              searchBy === 'title'
                ? 'Buscar por título'
                : searchBy === 'subject'
                ? 'Buscar por asignatura'
                : searchBy === 'authorName'
                ? 'Buscar por nombre del autor'
                : searchBy === 'authorEmail'
                ? 'Buscar por email del autor'
                : 'Buscar por ID'
            }
            value={searchQuery}
            onChange={handleSearchQueryChange}
            className="flex-1"
          />
          <select
            onChange={handleSearchByChange}
            className="p-2 border rounded bg-white w-full md:w-48"
          >
            <option value="title">Título</option>
            <option value="subject">Asignatura</option>
            <option value="authorName">Nombre del Autor</option>
            <option value="authorEmail">Email del Autor</option>
            <option value="id">ID</option>
          </select>
          <Button onClick={fetchQuizzes} className="w-full md:w-auto" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              'Refrescar'
            )}
          </Button>
          <Button onClick={goToUploadQuiz} className="w-full md:w-auto">
            Crear Quiz
          </Button>
        </div>
        {/* Loading State */}
        {error ? (
          <div className="max-w-4xl mx-auto p-4">
            <Card>
              <CardContent className="p-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          <div className="max-w-4xl mx-auto p-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">Cargando...</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Quiz Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="shadow-md rounded-lg border border-gray-200 flex flex-col justify-between h-full"
              >
                <div className="p-4">
                  <CardHeader className="text-xl font-semibold mb-2">{quiz.title}</CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      <strong>Asignatura:</strong> {quiz.subject}
                    </p>
                    <p className="text-sm">
                      <strong>Descripción:</strong> {quiz.description}
                    </p>
                    <p className="text-sm">
                      <strong>Autor:</strong> {quiz.authorName}
                    </p>
                  </CardContent>
                </div>
                <div className="p-4 pt-2 border-t">
                  <Button
                    onClick={() => handleQuizClick(quiz.id)}
                    className="w-full mt-2"
                  >
                    Acceder al Quiz
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Dialog open={IsAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar Quiz</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto">
            <UploadQuizForm />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );  
};

export default SearchQuizzes;