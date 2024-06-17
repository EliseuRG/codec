"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodecService = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const stream_1 = require("stream"); // Importe Readable do Node.js
class CodecService {
    compressVideo(inputBuffer, outputPath, progressStream) {
        return new Promise((resolve, reject) => {
            console.log('Iniciando compressão do vídeo...');
            // Crie um fluxo legível (Readable) a partir do buffer do arquivo
            const readableStream = new stream_1.Readable();
            readableStream.push(inputBuffer);
            readableStream.push(null); // Indique o fim do fluxo
            const command = (0, fluent_ffmpeg_1.default)()
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
    decompressVideo(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            console.log('Iniciando descompressão do vídeo...');
            (0, fluent_ffmpeg_1.default)(inputPath)
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
    getVideoInfo(inputPath) {
        return new Promise((resolve, reject) => {
            console.log('Obtendo informações do vídeo...');
            fluent_ffmpeg_1.default.ffprobe(inputPath, (err, metadata) => {
                if (err) {
                    console.error('Erro ao obter informações do vídeo:', err);
                    reject(err);
                }
                else {
                    console.log('Informações do vídeo obtidas com sucesso.');
                    resolve(metadata);
                }
            });
        });
    }
}
exports.CodecService = CodecService;
