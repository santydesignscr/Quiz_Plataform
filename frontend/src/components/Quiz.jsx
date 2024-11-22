import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UploadQuizForm from './UploadQuizForm';

import {
  InfoIcon,
  UserIcon,
  CalendarIcon,
  BookIcon,
  MailIcon
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [storedPassword, setStoredPassword] = useState('');

  // Previous state variables
  const [questions, setQuestions] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);

  // New state for edit and delete modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdateQuestionsModalOpen, setIsUpdateQuestionsModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [modalType, setModalType] = useState('');

  // State for edit fields
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedAuthorName, setEditedAuthorName] = useState('');
  const [editedAuthorEmail, setEditedAuthorEmail] = useState('');
  const [editError, setEditError] = useState('');

  // State for update questions
  const [fileInput, setFileInput] = useState(null);
  const [fileError, setFileError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [IsAddModalOpen, setIsAddModalOpen] = useState(false);

  const resetUpdateQuestionsModal = () => {
    setIsUpdateQuestionsModalOpen(false);
    setFileInput(null);
    setFileError('');
    setUpdateSuccess(false);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderQuizDetails = () => {
    if (!quizData) return null;

    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <InfoIcon className="w-4 h-4 text-gray-500" />
          <span className="font-semibold">ID:</span>
          <span>{quizData.id}</span>
        </div>
        <div className="flex items-center space-x-2">
          <BookIcon className="w-4 h-4 text-gray-500" />
          <span className="font-semibold">Materia:</span>
          <span>{quizData.subject || 'No especificado'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <UserIcon className="w-4 h-4 text-gray-500" />
          <span className="font-semibold">Autor:</span>
          <span>{quizData.authorName || 'Anónimo'}</span>
        </div>
        {quizData.authorEmail && (
          <div className="flex items-center space-x-2">
            <MailIcon className="w-4 h-4 text-gray-500" />
            <span className="font-semibold">Email:</span>
            <span>{quizData.authorEmail}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <span className="font-semibold">Creado:</span>
          <span>{formatDate(quizData.createdAt)}</span>
        </div>
        {quizData.description && (
          <div className="mt-2 italic text-gray-600">
            <span className="font-semibold">Descripción:</span> {quizData.description}
          </div>
        )}
      </div>
    );
  };

  // Función para mezclar las opciones de cada pregunta
  const shuffleOptions = (options) => options.sort(() => 0.5 - Math.random());

  // Función para obtener preguntas uniformemente por categoría
  const selectUniformQuestions = (allQuestions, totalQuestions = 50) => {
    const questionsByCategory = allQuestions.reduce((acc, question) => {
      if (!acc[question.category]) {
        acc[question.category] = [];
      }
      acc[question.category].push(question);
      return acc;
    }, {});

    const categories = Object.keys(questionsByCategory);
    const questionsPerCategory = Math.floor(totalQuestions / categories.length);
    const remainder = totalQuestions % categories.length;

    let selectedQuestions = [];

    categories.forEach((category, index) => {
      const categoryQuestions = questionsByCategory[category];
      const numQuestionsToSelect = questionsPerCategory + (index < remainder ? 1 : 0);
      const shuffled = [...categoryQuestions].sort(() => 0.5 - Math.random());
      selectedQuestions = [...selectedQuestions, ...shuffled.slice(0, numQuestionsToSelect)];
    });

    // Mezclamos las opciones de cada pregunta
    selectedQuestions = selectedQuestions.map((q) => ({
      ...q,
      options: shuffleOptions([...q.options])
    }));

    return selectedQuestions.sort(() => 0.5 - Math.random());
  };

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        // Primero, obtenemos los metadatos del quiz desde el backend
        const response = await fetch(`${API_URL}/api/quiz/${quizId}`);
        const data = await response.json();
        setQuizData(data);  // Almacenamos los metadatos del quiz

        // Luego, obtenemos las preguntas desde el archivo JSON proporcionado por fileUrl
        const questionsResponse = await fetch(API_URL + data.fileUrl);
        const questionsData = await questionsResponse.json();

        // Usamos la lógica original para mezclar las preguntas uniformemente si es necesario
        setQuestions(selectUniformQuestions(questionsData));  // Establecer las preguntas en el estado
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar las preguntas:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId]);

  // Handlers for Edit and Delete
  const openEditModal = () => {
    setModalType('edit');
    setIsPasswordModalOpen(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const openDeleteModal = () => {
    setModalType('delete');
    setIsPasswordModalOpen(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const openUpdateQuestionsModal = () => {
    setModalType('updateQuestions');
    setIsPasswordModalOpen(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const handlePasswordSubmit = async () => {
    try {
      // Verify password with backend
      const response = await fetch(`${API_URL}/api/quiz/${quizId}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: passwordInput })
      });

      const result = await response.json();

      if (result.valid) {
        setStoredPassword(passwordInput);
        setIsPasswordModalOpen(false);

        if (modalType === 'edit') {
          // Open edit dialog
          setIsEditModalOpen(true);
          setEditedTitle(quizData.title);
          setEditedSubject(quizData.subject);
          setEditedDescription(quizData.description);
          setEditedAuthorName(quizData.authorName);
          setEditedAuthorEmail(quizData.authorEmail);
        } else if (modalType === 'delete') {
          setModalType('confirmDelete');
        } else if (modalType === 'updateQuestions') {
          setIsUpdateQuestionsModalOpen(true);
        }
      } else {
        setPasswordError('Contraseña incorrecta');
      }
    } catch (error) {
      console.error('Error verificando contraseña:', error);
      setPasswordError('Error al verificar la contraseña');
    }
  };

  useEffect(() => {
    if (modalType === 'confirmDelete' && storedPassword) {
      confirmDelete();
    }
  }, [modalType, storedPassword]);


  const confirmDelete = async () => {
    try {
      console.log('Stored Password:', storedPassword); // Debugging

      const response = await fetch(`${API_URL}/api/quiz/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: storedPassword }) // Incluir la contraseña
      });

      if (response.ok) {
        // Redirigir al inicio después de eliminar
        navigate('/');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar el quiz');
      }
    } catch (error) {
      console.error('Error eliminando quiz:', error);
      setError('Error al eliminar el quiz');
    } finally {
      setStoredPassword('');
    }
  };

  const handleEditSubmit = async () => {
    // Validate that at least one field has been edited
    if (
      editedTitle === quizData.title &&
      editedSubject === quizData.subject &&
      editedDescription === quizData.description &&
      editedAuthorName === quizData.authorName &&
      editedAuthorEmail === quizData.authorEmail
    ) {
      setEditError('Debes editar al menos un campo.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', editedTitle);
      formData.append('subject', editedSubject);
      formData.append('description', editedDescription);
      formData.append('authorName', editedAuthorName);
      formData.append('authorEmail', editedAuthorEmail);
      formData.append('password', storedPassword);

      const response = await fetch(`${API_URL}/api/quiz/${quizId}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        navigate(0);
      } else {
        const errorData = await response.json();
        setEditError(errorData.message || 'Error al actualizar el quiz');
      }
    } catch (error) {
      console.error('Error actualizando quiz:', error);
      setEditError('Error al actualizar el quiz');
    } finally {
      setStoredPassword('');
    }
  };

  const goToUploadQuiz = () => {
    setIsAddModalOpen(true);
  };

  const handleUpdateQuestionsSubmit = async () => {
    if (!fileInput) {
      setFileError('Por favor, selecciona un archivo JSON.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);
      formData.append('title', quizData.title);
      formData.append('subject', quizData.subject);
      formData.append('description', quizData.description);
      formData.append('authorName', quizData.authorName);
      formData.append('authorEmail', quizData.authorEmail);
      formData.append('password', storedPassword);

      const response = await fetch(`${API_URL}/api/quiz/${quizId}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        setUpdateSuccess(true);
        // Refresh quiz data
        const updatedResponse = await fetch(`${API_URL}/api/quiz/${quizId}`);
        const updatedQuizData = await updatedResponse.json();
        setQuizData(updatedQuizData);
        // Reload questions
        const questionsResponse = await fetch(API_URL + updatedQuizData.fileUrl);
        const questionsData = await questionsResponse.json();
        setQuestions(selectUniformQuestions(questionsData));
      } else {
        const errorData = await response.json();
        setFileError(errorData.message || 'Error al actualizar las preguntas');
      }
    } catch (error) {
      console.error('Error actualizando preguntas:', error);
      setFileError('Error al actualizar las preguntas');
    }
  };

  // Resto de los métodos anteriores (handleAnswerSelect, calculateScore, etc.)
  const handleAnswerSelect = (questionId, answer) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (currentAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  };

  const handleSubmit = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);
  };

  const startNewTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/quiz/${quizId}`);
      if (!response.ok) {
        throw new Error(`Error al obtener los metadatos del quiz: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      const questionsResponse = await fetch(`http://localhost:5000${data.fileUrl}`);
      if (!questionsResponse.ok) {
        throw new Error(`Error al cargar las preguntas: ${questionsResponse.status} ${questionsResponse.statusText}`);
      }
      const questionsData = await questionsResponse.json();

      setQuestions(selectUniformQuestions(questionsData));
      setCurrentAnswers({});
      setShowResults(false);
      setScore(0);
    } catch (err) {
      console.error("Error en startNewTest:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getResultsByCategory = () => {
    const resultsByCategory = {};
    questions.forEach(q => {
      if (!resultsByCategory[q.category]) {
        resultsByCategory[q.category] = {
          total: 0,
          correct: 0
        };
      }
      resultsByCategory[q.category].total++;
      if (currentAnswers[q.id] === q.correctAnswer) {
        resultsByCategory[q.category].correct++;
      }
    });
    return resultsByCategory;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">Cargando preguntas...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
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
      {/* Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalType === 'edit' ? 'Editar Quiz' : modalType === 'delete' ? 'Eliminar Quiz' : 'Actualizar Preguntas'}</DialogTitle>
            <DialogDescription>
              Ingrese la contraseña para {modalType === 'edit' ? 'editar' : modalType === 'delete' ? 'eliminar' : 'actualizar las preguntas'} este quiz
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="col-span-3"
              />
            </div>
            {passwordError && (
              <div className="text-red-500 text-sm">{passwordError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handlePasswordSubmit}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Quiz</DialogTitle>
            <DialogDescription>
              Edita los detalles del quiz
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input
                id="title"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Materia
              </Label>
              <Input
                id="subject"
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Input
                id="description"
                type="text"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="authorName" className="text-right">
                Nombre del Autor
              </Label>
              <Input
                id="authorName"
                type="text"
                value={editedAuthorName}
                onChange={(e) => setEditedAuthorName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="authorEmail" className="text-right">
                Email del Autor
              </Label>
              <Input
                id="authorEmail"
                type="email"
                value={editedAuthorEmail}
                onChange={(e) => setEditedAuthorEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            {editError && (
              <div className="text-red-500 text-sm">{editError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleEditSubmit}
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Questions Modal */}
      <Dialog open={isUpdateQuestionsModalOpen} onOpenChange={setIsUpdateQuestionsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Preguntas</DialogTitle>
            <DialogDescription>
              Sube un nuevo archivo JSON con las preguntas actualizadas
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">
                Archivo JSON
              </Label>
              <Input
                id="file"
                type="file"
                accept=".json"
                onChange={(e) => setFileInput(e.target.files[0])}
                className="col-span-3"
              />
            </div>
            {fileError && (
              <div className="text-red-500 text-sm">{fileError}</div>
            )}
            {updateSuccess && (
              <div className="text-green-500 text-sm">Preguntas actualizadas exitosamente.</div>
            )}
          </div>
          <DialogFooter>
            {!updateSuccess && (
              <Button
                type="submit"
                onClick={handleUpdateQuestionsSubmit}
              >
                Actualizar Preguntas
              </Button>
            )}
            <Button
              type="button"
              onClick={() => resetUpdateQuestionsModal()}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Main Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{quizData ? quizData.title : "Test de Conocimientos"}</h2>
            </div>
          </div>
          {renderQuizDetails()}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={goToUploadQuiz} className="">Crear Quiz</Button>
            <Button variant="outline" onClick={openEditModal}>Editar</Button>
            <Button variant="outline" onClick={openUpdateQuestionsModal}>Actualizar Preguntas</Button>
            <Button variant="destructive" onClick={openDeleteModal}>Eliminar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {!showResults ? (
            <>
              {questions.length > 0 ? (
                questions.map((q, index) => (
                  <div key={q.id} className="mb-6 p-4 border rounded">
                    <div className="text-sm text-gray-500 mb-1">{q.category}</div>
                    <div className="font-semibold mb-2">{index + 1}. {q.question}</div>
                    <div className="space-y-2">
                      {q.options.map((option) => (
                        <div key={option} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={option}
                            checked={currentAnswers[q.id] === option}
                            onChange={() => handleAnswerSelect(q.id, option)}
                            className="mr-2"
                          />
                          <label>{option}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div>No se encontraron preguntas para este quiz.</div>
              )}
              <Button onClick={handleSubmit} className="w-full">Finalizar Test</Button>
            </>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>Tu calificación total: {score.toFixed(2)}%</AlertDescription>
              </Alert>
              <div className="space-y-4">
                {showResults && (
                  <div>
                    <h3 className="font-bold mb-4">Resultados por Categoría</h3>
                    <div className="space-y-2">
                      {Object.entries(getResultsByCategory()).map(([category, stats]) => (
                        <div key={category} className="p-4 border rounded-md">
                          <div className="font-semibold">{category}</div>
                          <div className="text-sm text-gray-600">
                            Correctas: {stats.correct} de {stats.total} (
                            {((stats.correct / stats.total) * 100).toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {questions.map((q, index) => (
                  <div key={q.id} className="p-4 border rounded">
                    <div className="text-sm text-gray-500">{q.category}</div>
                    <div className="font-semibold">{index + 1}. {q.question}</div>
                    <div className="mt-2">
                      <div className={`${currentAnswers[q.id] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                        Tu respuesta: {currentAnswers[q.id] || 'Sin respuesta'}
                      </div>
                      <div className="text-green-600">Respuesta correcta: {q.correctAnswer}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={startNewTest} className="w-full">Iniciar Nuevo Test</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Quiz;
