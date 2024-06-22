import { Request as ExpressRequest, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CodecService } from '../service/CodecService';
import progress from 'progress-stream';
import { wss } from '../server';
import WebSocket from 'ws';

interface Request extends ExpressRequest {
  file?: Express.Multer.File;
}

const codecService = new CodecService();

export async function compress(req: Request, res: Response) {
  if (!req.file || !req.file.buffer) {
    res.status(400).send('Nenhum arquivo enviado');
    return;
  }

  const inputBuffer = req.file.buffer;
  const tempInputPath = path.resolve('src/temp', req.file.originalname);
  const outputPath = path.resolve('src/compressed', req.file.originalname);

  const tempDir = path.dirname(tempInputPath);
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(tempInputPath, inputBuffer);

  try {
    const progressStream = progress({
      length: req.file.size,
      time: 100 // ms
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    progressStream.on('progress', function (p) {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(p));
        }
      });
    });

    const originalVideoInfo = await codecService.getVideoInfo(tempInputPath);
    await codecService.compressVideo(tempInputPath, outputPath, progressStream);
    const compressedVideoInfo = await codecService.getVideoInfo(outputPath);

    const originalName = req.file.originalname;
    const downloadLink = `/download/${originalName}`;

    console.log(`[52] downloadLink: ${downloadLink}`);
    res.status(200).send({
      downloadLink,
      originalName,
      originalVideoInfo,
      compressedVideoInfo
    });

  } catch (error) {
    if (error instanceof Error) {
      console.log("[61] Erro:", error.message);
      res.status(500).send(error.message);
    } else {
      console.log('[64] Ocorreu um erro desconhecido');
      res.status(500).send('Ocorreu um erro desconhecido');
    }
  } finally {
    fs.unlinkSync(tempInputPath);
  }
}

export function download(req: ExpressRequest, res: Response) {
  const filename = req.params.filename;
  const directoryPath = path.resolve(__dirname, '..', '..', 'src/compressed');
  const fullPath = path.join(directoryPath, filename);

  res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
  res.download(fullPath, filename, (err) => {
    if (err) {
      console.error('Não foi possível baixar o arquivo:', err);
      res.status(500).send('Erro ao baixar o arquivo');
    }
  });
}
