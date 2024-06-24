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
exports.AudioCodecService = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
class AudioCodecService {
    convertAudio(inputPath, outputPath, format) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)(inputPath)
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
        });
    }
    getAudioInfo(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
                        resolve({
                            format: metadata.format,
                            audio: audioStream,
                        });
                    }
                });
            });
        });
    }
}
exports.AudioCodecService = AudioCodecService;
