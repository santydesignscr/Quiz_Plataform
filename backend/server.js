const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: '../frontend/.env' });

const PORT = process.env.PORT || 5000;
const URL1 = process.env.URL1 || 'http://localhost:3000';
const URL2 = process.env.URL2 || 'http://localhost:5173';

const bcrypt = require('bcryptjs');
const app = express();

// Configuración de multer para control más preciso de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `quiz-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB límite de archivo
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.json') {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos JSON'));
  }
});

// Hashear una contraseña
const hashPassword = async (password) => {
  try {
    const saltRounds = 10; // Número de "salt rounds" (recomendado: 10-12)
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    return ("");
  }
};

const verifyPassword = async (enteredPassword, storedHash) => {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, storedHash);
    if (isMatch) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error al verificar la contraseña", error);
  }
};

// Configuración de CORS actualizada para permitir múltiples orígenes
app.use(cors({
  origin: [URL1, URL2], // Agregados múltiples orígenes
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Validación del JSON
const validateJson = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(data);

    if (!Array.isArray(jsonData)) {
      return { valid: false, message: 'El archivo debe contener un array de preguntas' };
    }

    const validQuestions = jsonData.every(q =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length > 0 &&
      q.correctAnswer
    );

    if (!validQuestions) {
      return { valid: false, message: 'Estructura JSON inválida. Cada pregunta debe tener question, options, y correctAnswer' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, message: 'Error al leer o parsear el JSON' };
  }
};

// Ruta para subir el quiz
app.post('/api/upload-quiz', upload.single('file'), async (req, res) => {
  try {
    let {
      title,
      subject,
      description,
      authorName,
      authorEmail,
      password
    } = req.body;

    // Validaciones
    if (!title || !subject) {
      return res.status(400).json({
        message: 'El título y la asignatura son obligatorios.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Por favor, sube un archivo JSON válido.'
      });
    }

    // Validar nombre del autor
    if (!authorName) {
      return res.status(400).json({
        message: 'El nombre del autor es obligatorio.'
      });
    }

    // Validar contraseña
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'La contraseña es obligatoria y debe tener al menos 6 caracteres.'
      });
    }

    // Validación opcional de email si se proporciona
    if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      return res.status(400).json({
        message: 'El formato del correo electrónico no es válido.'
      });
    }

    // Validar estructura del JSON
    const validationResult = await validateJson(req.file.path);
    if (!validationResult.valid) {
      await fs.unlink(req.file.path); // Eliminar archivo inválido
      return res.status(400).json({ message: validationResult.message });
    }

    let hashedPassword = await hashPassword(password);

    const quizId = uuidv4();
    const timestamp = Date.now();
    const fileName = `quiz-${title}-${timestamp}.json`;
    const newFilePath = path.join(__dirname, 'public', fileName);

    // Asegurar que el directorio 'public' exista
    await fs.mkdir(path.join(__dirname, 'public'), { recursive: true });

    // Mover archivo a directorio público
    await fs.rename(req.file.path, newFilePath);

    const quizData = {
      id: quizId,
      title,
      subject,
      description,
      authorName,
      authorEmail,
      fileUrl: `/public/${fileName}`,
      createdAt: new Date().toISOString(),
      password: hashedPassword
    };

    // Leer metadatos existentes
    let quizzesData = [];
    try {
      const metadataFile = await fs.readFile('quizzes_metadata.json', 'utf-8');
      quizzesData = JSON.parse(metadataFile);
    } catch (err) {
      // Si el archivo no existe, comenzar con un array vacío
    }

    quizzesData.push(quizData);

    // Guardar metadatos actualizados
    await fs.writeFile(
      'quizzes_metadata.json',
      JSON.stringify(quizzesData, null, 2)
    );

    const quizUrl = `/quiz/${quizId}`;

    res.json({
      message: 'Quiz cargado exitosamente',
      url: quizUrl,
      id: quizId
    });

  } catch (error) {
    res.status(500).json({
      message: 'Hubo un error al procesar el archivo.',
      error: error.message
    });
  }
});

// Ruta para buscar quizzes por título o asignatura
app.get('/api/search-quizzes', async (req, res) => {
  try {
    const { searchBy, query } = req.query;
    const quizzesData = await fs.readFile('quizzes_metadata.json', 'utf-8');
    const parsedQuizzes = JSON.parse(quizzesData || '[]');

    const filteredQuizzes = parsedQuizzes.filter(quiz =>
      quiz[searchBy].toLowerCase().includes(query.toLowerCase())
    );

    res.json(filteredQuizzes);
  } catch (error) {
    res.status(500).json({
      message: 'Error al buscar quizzes',
      error: error.message
    });
  }
});

// Ruta para obtener un quiz por ID
app.get('/api/quiz/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quizzesData = await fs.readFile('quizzes_metadata.json', 'utf-8');
    const parsedQuizzes = JSON.parse(quizzesData || '[]');

    const quiz = parsedQuizzes.find(q => q.id === id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz no encontrado' });
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener el quiz',
      error: error.message
    });
  }
});

// Ruta para obtener todos los quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzesData = await fs.readFile('quizzes_metadata.json', 'utf-8');
    const parsedQuizzes = JSON.parse(quizzesData || '[]');

    res.json(parsedQuizzes);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener los quizzes',
      error: error.message
    });
  }
});

// Ruta para verificar la contraseña del quiz
app.post('/api/quiz/:id/verify-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const quizzesData = await fs.readFile('quizzes_metadata.json', 'utf-8');
    const parsedQuizzes = JSON.parse(quizzesData || '[]');

    const quiz = parsedQuizzes.find(q => q.id === id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz no encontrado' });
    }

    if (await verifyPassword(password, quiz.password)) {
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error al verificar la contraseña',
      error: error.message
    });
  }
});

// Ruta para eliminar un quiz
app.delete('/api/quiz/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const quizzesData = await fs.readFile('quizzes_metadata.json', 'utf-8');
    const parsedQuizzes = JSON.parse(quizzesData || '[]');

    const quizIndex = parsedQuizzes.findIndex(q => q.id === id);

    if (quizIndex === -1) {
      return res.status(404).json({ message: 'Quiz no encontrado' });
    }

    const quiz = parsedQuizzes[quizIndex];

    if (!await verifyPassword(password, quiz.password)) {
      return res.status(400).json({
        message: 'La contraseña es incorrecta.'
      });
    }
    
    const filePath = path.join(__dirname, 'public', quiz.fileUrl.replace('/public/', ''));

    // Eliminar el archivo asociado
    await fs.unlink(filePath);

    // Eliminar el quiz de los metadatos
    parsedQuizzes.splice(quizIndex, 1);
    await fs.writeFile('quizzes_metadata.json', JSON.stringify(parsedQuizzes, null, 2));

    res.json({ message: 'Quiz eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar el quiz',
      error: error.message
    });
  }
});

// Ruta para editar un quiz
app.put('/api/quiz/:id', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subject,
      description,
      authorName,
      authorEmail,
      password
    } = req.body;

    const quizzesData = await fs.readFile('quizzes_metadata.json', 'utf-8');
    const parsedQuizzes = JSON.parse(quizzesData || '[]');

    const quizIndex = parsedQuizzes.findIndex(q => q.id === id);

    if (quizIndex === -1) {
      return res.status(404).json({ message: 'Quiz no encontrado' });
    }

    // Validaciones
    if (!title || !subject) {
      return res.status(400).json({
        message: 'El título y la asignatura son obligatorios.'
      });
    }

    // Validar nombre del autor
    if (!authorName) {
      return res.status(400).json({
        message: 'El nombre del autor es obligatorio.'
      });
    }

    // Validación opcional de email si se proporciona
    if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      return res.status(400).json({
        message: 'El formato del correo electrónico no es válido.'
      });
    }

    const quiz = parsedQuizzes[quizIndex];

    if (!await verifyPassword(password, quiz.password)) {
      return res.status(400).json({
        message: 'La contraseña es incorrecta.'
      });
    }

    // Actualizar los metadatos del quiz
    quiz.title = title;
    quiz.subject = subject;
    quiz.description = description;
    quiz.authorName = authorName;
    quiz.authorEmail = authorEmail;

    // Si se proporciona un nuevo archivo JSON
    if (req.file) {
      // Validar estructura del nuevo JSON
      const validationResult = await validateJson(req.file.path);
      if (!validationResult.valid) {
        await fs.unlink(req.file.path); // Eliminar archivo inválido
        return res.status(400).json({ message: validationResult.message });
      }

      const timestamp = Date.now();
      const fileName = `quiz-${title}-${timestamp}.json`;
      const newFilePath = path.join(__dirname, 'public', fileName);

      // Mover archivo a directorio público
      await fs.rename(req.file.path, newFilePath);

      // Eliminar el archivo anterior
      const oldFilePath = path.join(__dirname, 'public', quiz.fileUrl.replace('/public/', ''));
      await fs.unlink(oldFilePath);

      // Actualizar la ruta del archivo en los metadatos
      quiz.fileUrl = `/public/${fileName}`;
    }

    // Guardar los metadatos actualizados
    await fs.writeFile('quizzes_metadata.json', JSON.stringify(parsedQuizzes, null, 2));

    res.json({ message: 'Quiz actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar el quiz',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

// Crear directorios necesarios al iniciar
const initDirectories = async () => {
  try {
    await fs.mkdir('uploads', { recursive: true });
    await fs.mkdir('public', { recursive: true });
  } catch (error) {
    console.error('Error creando directorios:', error);
  }
};

initDirectories();
