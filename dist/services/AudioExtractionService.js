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
exports.AudioExtractionService = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
class AudioExtractionService {
    extractAudio(inputPath, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                console.log(`[AES]: Iniciando extração de áudio de ${inputPath}`);
                fluent_ffmpeg_1.default.ffprobe(inputPath, (err, metadata) => {
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
                    const command = (0, fluent_ffmpeg_1.default)(inputPath)
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
        });
    }
}
exports.AudioExtractionService = AudioExtractionService;
