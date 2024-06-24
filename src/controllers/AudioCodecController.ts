import { Request as ExpressRequest, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AudioCodecService } from '../services/AudioCodecService';

interface Request extends ExpressRequest {
  file?: Express.Multer.File;
}

const audioCodecService = new AudioCodecService();

export async function convertAudio(req: Request, res: Response) {
  if (!req.file || !req.file.buffer) {
    res.status(400).send('Nenhum arquivo enviado');
    return;
  }

  const inputBuffer = req.file.buffer;
  const tempInputPath = path.resolve(__dirname, '../../tmp', req.file.originalname);
  const outputFormat = req.body.format;

  if (!['mp3', 'wav', 'ogg'].includes(outputFormat)) {
    res.status(400).send('Formato de saída inválido');
    return;
  }

  const outputFileName = req.file.originalname.replace(/\.[^/.]+$/, `.${outputFormat}`);
  const outputPath = path.resolve(__dirname, '../../tmp', outputFileName);

  fs.writeFileSync(tempInputPath, inputBuffer);

  try {
    const originalInfo = await audioCodecService.getAudioInfo(tempInputPath);

    await audioCodecService.convertAudio(tempInputPath, outputPath, outputFormat);
    const convertedInfo = await audioCodecService.getAudioInfo(outputPath);

    const downloadLink = `/download/audio/${outputFileName}`;
    res.status(200).send({
      downloadLink,
      originalInfo,
      convertedInfo
    });
  } catch (error) {
    console.error('Erro na conversão:', error);
    res.status(500).send('Erro na conversão');
  } finally {
    fs.unlinkSync(tempInputPath);
  }
}

export function downloadAudio(req: ExpressRequest, res: Response) {
  console.log("[ACC] Iniciando download");
  const filename = req.params.filename;
  const directoryPath = path.resolve(__dirname, '../../tmp');
  const fullPath = path.join(directoryPath, filename);

  res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
  res.download(fullPath, filename, (err) => {
    if (err) {
      console.error('Não foi possível baixar o arquivo:', err);
      res.status(500).send('Erro ao baixar o arquivo');
    }
  });
}
