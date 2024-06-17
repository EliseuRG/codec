// CodecController.ts
import { Request as ExpressRequest, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { CodecService } from '../service/CodecService';
import progress from 'progress-stream';
import { wss } from '../server'; // Importe o 'wss' do arquivo 'server.ts'
import WebSocket from 'ws'; // Importe WebSocket se você planeja usá-lo

// Estenda a interface Request para incluir a propriedade file
interface Request extends ExpressRequest {
  file?: Express.Multer.File; // file pode ser undefined
}

const codecService = new CodecService();

export async function compress(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).send('Nenhum arquivo enviado');
    return;
  }

  const inputPath = req.file.path;
  const outputPath = 'src/compressed/' + req.file.filename + '.mp4'; // Adicione a extensão de arquivo correta

  try {
    // Verifique se o arquivo de entrada existe
    if (!fs.existsSync(inputPath)) {
      res.status(400).send('Arquivo de entrada não encontrado');
      return;
    }

    // Verifique se o diretório de saída existe e crie-o se não existir
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

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

    // Obtenha as informações do vídeo original
    const originalVideoInfo = await codecService.getVideoInfo(inputPath);
    //console.log('Original video info:', originalVideoInfo);

    // Use o stream de progresso ao chamar o método compressVideo
    await codecService.compressVideo(inputPath, outputPath, progressStream);

    // Obtenha as informações do vídeo comprimido
    const compressedVideoInfo = await codecService.getVideoInfo(outputPath);
    //console.log('Compressed video info:', compressedVideoInfo);

    // Retorne o link de download e as informações do vídeo como resposta
    res.status(200).send({
      downloadLink: `/download/${req.file.filename}.mp4`,
      originalVideoInfo,
      compressedVideoInfo
    });

  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send('Ocorreu um erro desconhecido');
    }
  }
}

export function download(req: ExpressRequest, res: Response) {
  const filename      = req.params.filename;
  const directoryPath = path.resolve(__dirname, '..', '..', 'src/compressed');
  const fullPath      = path.join(directoryPath, filename);

  //console.log(`FILENAME.: ${filename}`);
  //console.log(`DIRECTORY: ${directoryPath}`);
  //console.log(`FULLPATH.: ${fullPath}`);
  
  res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
  res.download(fullPath, filename, (err) => {
    if (err) {
      res.status(500).send({
        message: "Não foi possível baixar o arquivo. " + err,
      });
    }
  });
}