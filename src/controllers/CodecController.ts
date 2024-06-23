// CodecController.ts
import { Request as ExpressRequest, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CodecService } from '../services/CodecService';
import progress from 'progress-stream';
import { wss } from '../server';
import WebSocket from 'ws';

interface Request extends ExpressRequest {
  file?: Express.Multer.File;
}

const codecService = new CodecService();

export async function compress(req: Request, res: Response) {

  console.log('[CC]:18 Iniciando compressão do vídeo');
  if (!req.file || !req.file.buffer) {
    res.status(400).send('Nenhum arquivo enviado');
    return;
  }

  const inputBuffer = req.file.buffer;
  console.log('[CC]:26 Buffer do arquivo recebido');
  const tempInputPath = path.resolve(__dirname, '../../tmp/temp', req.file.originalname);
  console.log('[CC]:27 Caminho temporário do arquivo:', tempInputPath);
  const outputPath = path.resolve(__dirname, '../../tmp/compressed', req.file.originalname);
  console.log('[CC]:29 Caminho de saída do arquivo:', outputPath);

  const tempDir = path.dirname(tempInputPath);
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(tempDir)) {
    console.log('[CC]:35 Criando diretório temporário');
    fs.mkdirSync(tempDir, { recursive: true });
  }
  if (!fs.existsSync(outputDir)) {
    console.log('[CC]:39 Criando diretório de saída');
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('[CC]:43 Escrevendo buffer no arquivo temporário');
  fs.writeFileSync(tempInputPath, inputBuffer);

  try {

    console.log('[CC]:48 Iniciando compressão do vídeo');
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

    console.log('[CC]:66 Obtendo informações do vídeo original');
    const originalVideoInfo = await codecService.getVideoInfo(tempInputPath);

    console.log('[CC]:69 Comprimindo vídeo');
    await codecService.compressVideo(tempInputPath, outputPath, progressStream);

    console.log('[CC]:72 Obtendo informações do vídeo comprimido');
    const compressedVideoInfo = await codecService.getVideoInfo(outputPath);

    const originalName = req.file.originalname;
    const downloadLink = `/download/${originalName}`;

    console.log(`[CC]:78 Link de download: ${downloadLink}`);
    res.status(200).send({
      downloadLink,
      originalName,
      originalVideoInfo,
      compressedVideoInfo
    });

  } catch (error) {
    if (error instanceof Error) {
      console.log("[88] Erro:", error.message);
      res.status(500).send(error.message);
    } else {
      console.log('[91] Ocorreu um erro desconhecido');
      res.status(500).send('Ocorreu um erro desconhecido');
    }
  } finally {
    fs.unlinkSync(tempInputPath);
  }
}

export function download(req: ExpressRequest, res: Response) {

  console.log('[CC]:102 Iniciando download do arquivo');
  const filename = req.params.filename;
  const directoryPath = path.resolve(__dirname, '../../tmp/compressed');
  console.log("[CC]:104 directoryPath", directoryPath)
  const fullPath = path.join(directoryPath, filename);

  res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
  res.download(fullPath, filename, (err) => {
    if (err) {
      console.error('Não foi possível baixar o arquivo:', err);
      res.status(500).send('Erro ao baixar o arquivo');
    }
  });
}
