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
exports.extractAudio = extractAudio;
const AudioExtractionService_1 = require("../services/AudioExtractionService");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const audioExtractionService = new AudioExtractionService_1.AudioExtractionService();
function extractAudio(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.file || !req.file.buffer) {
            res.status(400).json({ error: 'Nenhum arquivo enviado' });
            return;
        }
        const inputBuffer = req.file.buffer;
        const tempInputPath = path_1.default.resolve(__dirname, '../../tmp', req.file.originalname);
        const outputFileName = req.file.originalname.replace(/\.[^/.]+$/, "") + ".mp3";
        const outputPath = path_1.default.resolve(__dirname, '../../tmp', outputFileName);
        console.log(`[AEC]: Recebido arquivo: ${req.file.originalname}, tamanho: ${req.file.size}`);
        if (!fs_1.default.existsSync(path_1.default.dirname(tempInputPath))) {
            fs_1.default.mkdirSync(path_1.default.dirname(tempInputPath), { recursive: true });
        }
        fs_1.default.writeFileSync(tempInputPath, inputBuffer);
        try {
            yield audioExtractionService.extractAudio(tempInputPath, outputPath);
            res.status(200).json({ downloadLink: `/download/audio/${outputFileName}` });
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`[AEC]: Erro na extração de áudio: ${error.message}`);
                res.status(500).json({ error: error.message });
            }
            else {
                console.error('[AEC]: Ocorreu um erro desconhecido');
                res.status(500).json({ error: 'Ocorreu um erro desconhecido' });
            }
        }
        finally {
            fs_1.default.unlinkSync(tempInputPath);
        }
    });
}
