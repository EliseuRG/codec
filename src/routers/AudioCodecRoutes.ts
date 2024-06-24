//AudioController.ts
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { convertAudio, downloadAudio } from '../controllers/AudioCodecController';

const router = express.Router();

// Configuração do multer para armazenar em memória
const memoryStorage = multer.memoryStorage();
const upload = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 10000000 } // Limite de 10MB
});

router.post('/audio-compress', upload.single('audio'), convertAudio);
router.get('/download/audio/:filename', downloadAudio);

router.use((err: multer.MulterError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).send('Arquivo muito grande: Limite de 10MB');
  } else {
    console.error('Erro na conversão:', err);
    res.status(500).send('Erro na conversão');
  }
});

export default router;
