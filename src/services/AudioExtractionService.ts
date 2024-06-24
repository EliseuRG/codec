import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

export class AudioExtractionService {
  async extractAudio(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[AES]: Iniciando extração de áudio de ${inputPath}`);

      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          console.error(`[AES]: Erro ao obter informações do arquivo: ${err.message}`);
          reject(new Error(`Erro ao obter informações do arquivo: ${err.message}`));
          return;
        }

        const hasAudioStream = metadata.streams.some(stream => stream.codec_type === 'audio');
        if (!hasAudioStream) {
          console.error('[AES]: Arquivo de entrada não contém nenhuma faixa de áudio');
          reject(new Error('Arquivo de entrada não contém nenhuma faixa de áudio'));
          return;
        }

        const command = ffmpeg(inputPath)
          .outputOptions('-y') // Sobrescrever o arquivo de saída, se existir
          .audioCodec('libmp3lame') // Codec de áudio para MP3
          .save(outputPath);

        command
          .on('start', (commandLine) => {
            console.log(`[AES]: Comando ffmpeg iniciado: ${commandLine}`);
          })
          .on('end', () => {
            console.log('[AES]: Extração de áudio concluída.');
            resolve();
          })
          .on('error', (error) => {
            console.error(`[AES]: Erro durante a extração de áudio: ${error.message}`);
            reject(error);
          })
          .run();
      });
    });
  }
}
