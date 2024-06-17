// CodecService.ts
import { Writable } from 'stream';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';


export class CodecService {
  compressVideo(inputPath: string, outputPath: string, progressStream?: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions('-vf', 'scale=iw/2:ih/2') // Reduz a resolução pela metade
        .outputOptions('-pix_fmt', 'yuv420p') // Aplica a subamostragem de cor 4:2:0
        .on('progress', progress => {
          if (progressStream) {
            progressStream.write(`data: ${JSON.stringify(progress)}\n\n`);
          }
        })
        .output(outputPath); // Sempre defina a saída para outputPath

      command
        .on('end', () => {
          //console.log('Compressão concluída');
          resolve();
        })
        .on('error', (error) => {
          console.error(`Compressão com erro: ${error}`);
          reject(error);
        })
        .run();
    });
  }

  decompressVideo(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  getVideoInfo(inputPath: string): Promise<FfprobeData> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }
}