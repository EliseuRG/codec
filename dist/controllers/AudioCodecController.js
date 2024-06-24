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
exports.convertAudio = convertAudio;
exports.downloadAudio = downloadAudio;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const AudioCodecService_1 = require("../services/AudioCodecService");
const audioCodecService = new AudioCodecService_1.AudioCodecService();
function convertAudio(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.file || !req.file.buffer) {
            res.status(400).send('Nenhum arquivo enviado');
            return;
        }
        const inputBuffer = req.file.buffer;
        const tempInputPath = path_1.default.resolve(__dirname, '../../tmp', req.file.originalname);
        const outputFormat = req.body.format;
        if (!['mp3', 'wav', 'ogg'].includes(outputFormat)) {
            res.status(400).send('Formato de saída inválido');
            return;
        }
        const outputFileName = req.file.originalname.replace(/\.[^/.]+$/, `.${outputFormat}`);
        const outputPath = path_1.default.resolve(__dirname, '../../tmp', outputFileName);
        fs_1.default.writeFileSync(tempInputPath, inputBuffer);
        try {
            const originalInfo = yield audioCodecService.getAudioInfo(tempInputPath);
            yield audioCodecService.convertAudio(tempInputPath, outputPath, outputFormat);
            const convertedInfo = yield audioCodecService.getAudioInfo(outputPath);
            const downloadLink = `/download/audio/${outputFileName}`;
            res.status(200).send({
                downloadLink,
                originalInfo,
                convertedInfo
            });
        }
        catch (error) {
            console.error('Erro na conversão:', error);
            res.status(500).send('Erro na conversão');
        }
        finally {
            fs_1.default.unlinkSync(tempInputPath);
        }
    });
}
function downloadAudio(req, res) {
    console.log("[ACC] Iniciando download");
    const filename = req.params.filename;
    const directoryPath = path_1.default.resolve(__dirname, '../../tmp');
    const fullPath = path_1.default.join(directoryPath, filename);
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.download(fullPath, filename, (err) => {
        if (err) {
            console.error('Não foi possível baixar o arquivo:', err);
            res.status(500).send('Erro ao baixar o arquivo');
        }
    });
}
