"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodecService = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
class CodecService {
    compressVideo(inputPath, outputPath, progressStream) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                console.log('[CS]:08 Iniciando compressão do vídeo...');
                const command = (0, fluent_ffmpeg_1.default)()
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
        });
    }
    decompressVideo(inputPath, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                console.log('[CS]:42 Iniciando descompressão do vídeo...');
                (0, fluent_ffmpeg_1.default)(inputPath)
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
        });
    }
    getVideoInfo(inputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                console.log('[CS]:54 Obtendo informações do vídeo...');
                fluent_ffmpeg_1.default.ffprobe(inputPath, (err, metadata) => {
                    if (err) {
                        console.error('[CS]:67 Erro ao obter informações do vídeo:', err);
                        reject(err);
                    }
                    else {
                        console.log('[CS]:70 Informações do vídeo obtidas com sucesso.');
                        resolve(metadata);
                    }
                });
            });
        });
    }
}
exports.CodecService = CodecService;
