// AudioExtractionRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import { extractAudio } from '../controllers/AudioExtractionController';
import multer from 'multer';

const router = express.Router();

// Configuração do multer para armazenar em memória
const memoryStorage = multer.memoryStorage();
const upload = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 10000000 } // Limite de 10MB
});

router.post('/extract-audio', upload.single('videoFile'), extractAudio);

router.use((err: multer.MulterError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).send('Arquivo muito grande: Limite de 10MB');
  } else {
    console.error('Erro na extração de áudio:', err);
    res.status(500).send('Erro na extração de áudio');
  }
});

export default router;
