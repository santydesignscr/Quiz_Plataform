import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UploadQuizForm = () => {
  const [step, setStep] = useState(1); // Controla los pasos
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [quizLength, setQuizLength] = useState(50);
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState(""); // Nombre del autor
  const [authorEmail, setAuthorEmail] = useState(""); // Correo del autor
  const [password, setPassword] = useState(""); // Contraseña para edición
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [quizUrl, setQuizUrl] = useState(""); // URL del quiz generado
  const [IsUploading, setIsUploading] = useState(false);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Por favor, seleccione un archivo JSON válido.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("El archivo supera el límite de 25MB.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("length", quizLength);
    formData.append("description", description);
    formData.append("authorName", authorName);
    formData.append("authorEmail", authorEmail);
    formData.append("password", password);
    formData.append("file", file);

    try {
      setIsUploading(true);
      const response = await fetch(API_URL + "/api/upload-quiz", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setQuizUrl(result.url);
        setStep(5); // Ir al paso de éxito
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Hubo un error al procesar el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuizLengthChange = (e) => {
    const value = e.target.value;
    const numericValue = Number(value);
    if (value != '') {
      setQuizLength(numericValue === 0 ? 50 : numericValue);
    }
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Título principal */}
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          Subir un Nuevo Quiz
        </h1>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Paso {step} de 5</span>
          <div className="flex space-x-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  step === i + 1 ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Step 1: Detalles del Quiz */}
        {step === 1 && (
          <>
          <h2 className="text-lg font-semibold text-gray-700">
            Detalles del Quiz
          </h2>
          <form className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Título del Quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="col-span-3 w-full"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Asignatura
              </Label>
              <Input
                id="subject"
                type="text"
                placeholder="Asignatura"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="col-span-3 w-full"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quizLength" className="text-right">
                Tamaño del Quiz (50 predeterminado)
              </Label>
              <Input
                id="quizLength"
                type="number"
                placeholder="Tamaño del Quiz (50 predeterminado)"
                value={quizLength === '' ? '' : quizLength}
                onChange={handleQuizLengthChange}
                required
                className="col-span-3 w-full"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                placeholder="Descripción del Quiz"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 w-full"
              />
            </div>
          </form>
          <Button onClick={handleNext} className="w-full">
            Siguiente
          </Button>
        </>        
        )}

        {/* Step 2: Información del Autor */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-gray-700">
              Información del Autor
            </h2>
            <form className="space-y-4">
              <Input
                type="text"
                placeholder="Nombre del Autor"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                className="w-full"
              />
              <Input
                type="email"
                placeholder="Correo Electrónico (Opcional)"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                className="w-full"
              />
              <Input
                type="password"
                placeholder="Contraseña para Editar el Quiz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </form>
            <div className="flex justify-between">
              <Button onClick={handleBack} variant="outline">
                Atrás
              </Button>
              <Button onClick={handleNext}>Siguiente</Button>
            </div>
          </>
        )}

        {/* Step 3: Instrucciones */}
        {step === 3 && (
          <>
          <h2 className="text-lg font-semibold text-gray-700">
            Formato del Archivo JSON
          </h2>
          <p className="text-gray-600">
            Sigue este formato para agregar las preguntas del quiz en un archivo JSON:
          </p>
          <pre className="bg-gray-100 p-4 rounded text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
{`[
  {
    "id": 1,
    "category": "Patrones de Diseño",
    "question": "¿Qué son los patrones de diseño?",
    "options": [
      "Soluciones a problemas específicos en hardware",
      "Soluciones comprobadas para problemas comunes en desarrollo de software",
      "Métodos para reducir el código en un proyecto"
    ],
    "correctAnswer": "Soluciones comprobadas para problemas comunes en desarrollo de software"
  }
]`}
          </pre>
          <p className="text-gray-600">
            Cada pregunta del quiz debe estar en un objeto JSON dentro de un array. Cada objeto debe contener los siguientes campos:
          </p>
          <ul className="list-disc list-inside text-gray-600">
            <li><strong>id</strong>: Un identificador único para la pregunta. Debe ser un número entero.</li>
            <li><strong>category</strong>: La categoría a la que pertenece la pregunta. Debe ser una cadena de texto.</li>
            <li><strong>question</strong>: El texto de la pregunta. Debe ser una cadena de texto.</li>
            <li><strong>options</strong>: Un array de opciones de respuesta. Cada opción debe ser una cadena de texto.</li>
            <li><strong>correctAnswer</strong>: La respuesta correcta a la pregunta. Debe ser una cadena de texto y debe coincidir exactamente con una de las opciones en el array de opciones.</li>
          </ul>
          <p className="text-gray-600">
            Aquí tienes un ejemplo de cómo crear un archivo JSON con múltiples preguntas:
          </p>
          <pre className="bg-gray-100 p-4 rounded text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
{`[
  {
    "id": 1,
    "category": "Patrones de Diseño",
    "question": "¿Qué son los patrones de diseño?",
    "options": [
      "Soluciones a problemas específicos en hardware",
      "Soluciones comprobadas para problemas comunes en desarrollo de software",
      "Métodos para reducir el código en un proyecto"
    ],
    "correctAnswer": "Soluciones comprobadas para problemas comunes en desarrollo de software"
  },
  {
    "id": 2,
    "category": "Programación",
    "question": "¿Qué es una función en programación?",
    "options": [
      "Un bloque de código que realiza una tarea específica",
      "Una variable que almacena datos",
      "Un tipo de dato"
    ],
    "correctAnswer": "Un bloque de código que realiza una tarea específica"
  },
  {
    "id": 3,
    "category": "Bases de Datos",
    "question": "¿Qué es una base de datos relacional?",
    "options": [
      "Una base de datos que almacena datos en tablas",
      "Una base de datos que almacena datos en archivos",
      "Una base de datos que almacena datos en documentos"
    ],
    "correctAnswer": "Una base de datos que almacena datos en tablas"
  }
]`}
          </pre>
          <p className="text-gray-600">
            Para crear el archivo JSON, sigue estos pasos:
          </p>
          <ol className="list-decimal list-inside text-gray-600">
            <li>Abre un editor de texto o un editor de código (como Visual Studio Code, Sublime Text, o incluso el Bloc de notas).</li>
            <li>Copia y pega el formato JSON proporcionado arriba en el editor.</li>
            <li>Modifica los campos <strong>id</strong>, <strong>category</strong>, <strong>question</strong>, <strong>options</strong>, y <strong>correctAnswer</strong> según tus necesidades.</li>
            <li>Guarda el archivo con la extensión <strong>.json</strong>. Por ejemplo, puedes nombrarlo <strong>quiz_questions.json</strong>.</li>
            <li>Asegúrate de que el archivo JSON esté correctamente formateado y no contenga errores de sintaxis.</li>
          </ol>
          <div className="flex justify-between">
            <Button onClick={handleBack} variant="outline">
              Atrás
            </Button>
            <Button onClick={handleNext}>Siguiente</Button>
          </div>
        </>        
        )}

        {/* Step 4: Subir Archivo JSON */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-semibold text-gray-700">
              Subir Archivo JSON
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files[0])}
                required
                className="w-full"
                disabled={IsUploading}
              />
              <Button type="submit" className="w-full" disabled={IsUploading}>
              {IsUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando Quiz...
                </>
              ) : (
                'Subir Quiz'
              )}
              </Button>
              {error && <div className="text-red-500 text-sm">{error}</div>}
            </form>
            <Button onClick={handleBack} variant="outline">
              Atrás
            </Button>
          </>
        )}

        {/* Step 5: Confirmación */}
        {step === 5 && (
          <>
            <h2 className="text-lg font-semibold text-gray-700">
              ¡Quiz Creado Exitosamente!
            </h2>
            <p className="text-gray-600">Tu quiz ha sido creado con éxito.</p>
            <p className="text-blue-600 break-words">
              <a href={window.location.origin + quizUrl} target="_blank" rel="noopener noreferrer">
                {window.location.origin + quizUrl}
              </a>
            </p>
            <Button
              onClick={() => window.open(window.location.origin + quizUrl, "_blank")}
              className="w-full"
            >
              Abrir Quiz
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadQuizForm;
