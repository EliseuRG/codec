import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

export class AudioCodecService {
  async convertAudio(inputPath: string, outputPath: string, format: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat(format)
        .on('start', (commandLine) => {
          console.log(`Comando ffmpeg iniciado: ${commandLine}`);
        })
        .on('end', () => {
          console.log('Conversão de áudio concluída.');
          resolve();
        })
        .on('error', (error) => {
          console.error('Erro durante a conversão do áudio:', error);
          reject(error);
        })
        .save(outputPath);
    });
  }

  async getAudioInfo(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
          resolve({
            format: metadata.format,
            audio: audioStream,
          });
        }
      });
    });
  }
}
