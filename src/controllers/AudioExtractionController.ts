import { Request as ExpressRequest, Response } from 'express';
import { AudioExtractionService } from '../services/AudioExtractionService';
import path from 'path';
import fs from 'fs';

interface Request extends ExpressRequest {
  file?: Express.Multer.File;
}

const audioExtractionService = new AudioExtractionService();

export async function extractAudio(req: Request, res: Response) {
  if (!req.file || !req.file.buffer) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }

  const inputBuffer = req.file.buffer;
  const tempInputPath = path.resolve(__dirname, '../../tmp', req.file.originalname);
  const outputFileName = req.file.originalname.replace(/\.[^/.]+$/, "") + ".mp3";
  const outputPath = path.resolve(__dirname, '../../tmp', outputFileName);

  console.log(`[AEC]: Recebido arquivo: ${req.file.originalname}, tamanho: ${req.file.size}`);

  if (!fs.existsSync(path.dirname(tempInputPath))) {
    fs.mkdirSync(path.dirname(tempInputPath), { recursive: true });
  }

  fs.writeFileSync(tempInputPath, inputBuffer);

  try {
    await audioExtractionService.extractAudio(tempInputPath, outputPath);
    res.status(200).json({ downloadLink: `/download/audio/${outputFileName}` });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[AEC]: Erro na extração de áudio: ${error.message}`);
      res.status(500).json({ error: error.message });
    } else {
      console.error('[AEC]: Ocorreu um erro desconhecido');
      res.status(500).json({ error: 'Ocorreu um erro desconhecido' });
    }
  } finally {
    fs.unlinkSync(tempInputPath);
  }
}
