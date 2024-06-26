// CodecService.ts
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

export class CodecService {
  async compressVideo(inputPath: string, outputPath: string, progressStream?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[CS]:08 Iniciando compressão do vídeo...');

      const command = ffmpeg()
        .input(inputPath)
        .outputOptions('-vf', 'scale=iw/2:ih/2') // Reduz a resolução pela metade
        .outputOptions('-pix_fmt', 'yuv420p') // Aplica a subamostragem de cor 4:2:0
        .outputOptions('-c:v', 'libx264') // Usa o codec H.264
        .outputOptions('-crf', '28') // Aplica compressão com fator de qualidade constante (28 é um valor comum)
        .outputOptions('-preset', 'fast') // Usa um preset de compressão rápida (ajuste conforme necessário)
        .on('progress', (progress) => {
          if (progressStream) {
            progressStream.write(`data: ${JSON.stringify(progress)}\n\n`);
          }
        })
        .output(outputPath);

      command
        .on('start', (commandLine) => {
          console.log(`[CS]:26 Comando ffmpeg iniciado: ${commandLine}`);
        })
        .on('end', () => {
          console.log('[CS]:29 Compressão do vídeo concluída.');
          resolve();
        })
        .on('error', (error) => {
          console.error('[CS]:33 Erro durante a compressão do vídeo:', error);
          reject(error);
        })
        .run();
    });
  }

  async decompressVideo(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[CS]:42 Iniciando descompressão do vídeo...');

      ffmpeg(inputPath)
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log(`[CS]:47 Comando ffmpeg iniciado: ${commandLine}`);
        })
        .on('end', () => {
          console.log('[CS]:50 Descompressão do vídeo concluída.');
          resolve();
        })
        .on('error', (error) => {
          console.error('[CS]:54 Erro durante a descompressão do vídeo:', error);
          reject(error);
        })
        .run();
    });
  }

  async getVideoInfo(inputPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('[CS]:54 Obtendo informações do vídeo...');

      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          console.error('[CS]:67 Erro ao obter informações do vídeo:', err);
          reject(err);
        } else {
          console.log('[CS]:70 Informações do vídeo obtidas com sucesso.');
          resolve(metadata);
        }
      });
    });
  }
}
