// CodecService.ts
import { Writable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream'; // Importe Readable do Node.js

export class CodecService {
  compressVideo(inputBuffer: Buffer, outputPath: string, progressStream?: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Iniciando compressão do vídeo...');

      // Crie um fluxo legível (Readable) a partir do buffer do arquivo
      const readableStream = new Readable();
      readableStream.push(inputBuffer);
      readableStream.push(null); // Indique o fim do fluxo

      const command = ffmpeg()
        .input(readableStream) // Use o fluxo legível como entrada
        .outputOptions('-vf', 'scale=iw/2:ih/2') // Reduz a resolução pela metade
        .outputOptions('-pix_fmt', 'yuv420p') // Aplica a subamostragem de cor 4:2:0
        .on('progress', progress => {
          if (progressStream) {
            progressStream.write(`data: ${JSON.stringify(progress)}\n\n`);
          }
        })
        .output(outputPath); // Saída para outputPath

      command
        .on('start', commandLine => {
          console.log(`Comando ffmpeg iniciado: ${commandLine}`);
        })
        .on('end', () => {
          console.log('Compressão do vídeo concluída.');
          resolve();
        })
        .on('error', (error) => {
          console.error('Erro durante a compressão do vídeo:', error);
          reject(error);
        })
        .run();
    });
  }

  decompressVideo(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Iniciando descompressão do vídeo...');

      ffmpeg(inputPath)
        .output(outputPath)
        .on('start', commandLine => {
          console.log(`Comando ffmpeg iniciado: ${commandLine}`);
        })
        .on('end', () => {
          console.log('Descompressão do vídeo concluída.');
          resolve();
        })
        .on('error', (error) => {
          console.error('Erro durante a descompressão do vídeo:', error);
          reject(error);
        })
        .run();
    });
  }

  getVideoInfo(inputPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('Obtendo informações do vídeo...');

      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          console.error('Erro ao obter informações do vídeo:', err);
          reject(err);
        } else {
          console.log('Informações do vídeo obtidas com sucesso.');
          resolve(metadata);
        }
      });
    });
  }
}
