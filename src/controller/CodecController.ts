// CodecController.ts
import { Request as ExpressRequest, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CodecService } from '../service/CodecService';
import progress from 'progress-stream';
import { wss } from '../server'; // Importe o 'wss' do arquivo 'server.ts'
import WebSocket from 'ws'; // Importe WebSocket se você planeja usá-lo

interface Request extends ExpressRequest {
  file?: Express.Multer.File;
}

const codecService = new CodecService();

export async function compress(req: Request, res: Response) {
  if (!req.file || !req.file.buffer) {
    res.status(400).send('Nenhum arquivo enviado');
    return;
  }

  const inputBuffer = req.file.buffer; // Acesse o conteúdo do arquivo diretamente do buffer em memória
  const outputPath = 'src/compressed/' + req.file.originalname; // Nome do arquivo de saída

  try {
    // Crie um stream de progresso
    const progressStream = progress({
      length: req.file.size,
      time: 100 /* ms */
    });

    // Configure a resposta para SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    progressStream.on('progress', function(p) {
      // Envie um evento de progresso para todos os clientes WebSocket
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(p));
        }
      });
    });

    // Use o stream de progresso ao chamar o método compressVideo
    await codecService.compressVideo(inputBuffer, outputPath, progressStream);

    // Obtenha as informações do vídeo comprimido diretamente do buffer de saída
    const compressedVideoInfo = await codecService.getVideoInfo(outputPath);

    const originalName = req.file.originalname;
    const downloadLink = `/download/${originalName}`;

    console.log(`[52] downloadLink: ${downloadLink}`);
    // Retorne o link de download e as informações do vídeo como resposta
    res.status(200).send({
      downloadLink,
      originalName,
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
