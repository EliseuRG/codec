// CodecRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { compress, download } from '../controller/CodecController';

const router = express.Router();

// Configuração do multer para armazenar em memória
const memoryStorage = multer.memoryStorage();
const upload = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 10000000 } // Limite de 10MB
});

router.post('/compress', upload.single('video'), compress);
router.get('/download/:filename', download);

router.use((err: multer.MulterError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).send('Arquivo muito grande: Limite de 10MB');
  } else {
    console.error('Erro na compressão:', err);
    res.status(500).send('Erro na compressão');
  }
});

export default router;
