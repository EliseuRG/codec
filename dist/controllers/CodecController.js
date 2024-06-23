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
exports.compress = compress;
exports.download = download;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CodecService_1 = require("../services/CodecService");
const progress_stream_1 = __importDefault(require("progress-stream"));
const server_1 = require("../server");
const ws_1 = __importDefault(require("ws"));
const codecService = new CodecService_1.CodecService();
function compress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('[CC]:18 Iniciando compressão do vídeo');
        if (!req.file || !req.file.buffer) {
            res.status(400).send('Nenhum arquivo enviado');
            return;
        }
        const inputBuffer = req.file.buffer;
        console.log('[CC]:26 Buffer do arquivo recebido');
        const tempInputPath = path_1.default.resolve(__dirname, '../../tmp', req.file.originalname);
        console.log('[CC]:27 Caminho temporário do arquivo:', tempInputPath);
        // Adicionando sufixo "_compressed" ao nome do arquivo de saída
        const compressedFileName = req.file.originalname.replace(/\.[^/.]+$/, "") + "_compressed.mp4";
        const outputPath = path_1.default.resolve(__dirname, '../../tmp', compressedFileName);
        console.log('[CC]:29 Caminho de saída do arquivo:', outputPath);
        const tempDir = path_1.default.dirname(tempInputPath);
        const outputDir = path_1.default.dirname(outputPath);
        if (!fs_1.default.existsSync(tempDir)) {
            console.log('[CC]:35 Criando diretório temporário');
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        if (!fs_1.default.existsSync(outputDir)) {
            console.log('[CC]:39 Criando diretório de saída');
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        console.log('[CC]:43 Escrevendo buffer no arquivo temporário');
        fs_1.default.writeFileSync(tempInputPath, inputBuffer);
        try {
            console.log('[CC]:48 Iniciando compressão do vídeo');
            const progressStream = (0, progress_stream_1.default)({
                length: req.file.size,
                time: 100 // ms
            });
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            progressStream.on('progress', function (p) {
                server_1.wss.clients.forEach(client => {
                    if (client.readyState === ws_1.default.OPEN) {
                        client.send(JSON.stringify(p));
                    }
                });
            });
            console.log('[CC]:66 Obtendo informações do vídeo original');
            const originalVideoInfo = yield codecService.getVideoInfo(tempInputPath);
            console.log('[CC]:69 Comprimindo vídeo');
            yield codecService.compressVideo(tempInputPath, outputPath, progressStream);
            console.log('[CC]:72 Obtendo informações do vídeo comprimido');
            const compressedVideoInfo = yield codecService.getVideoInfo(outputPath);
            const downloadLink = `/download/${compressedFileName}`;
            console.log(`[CC]:78 Link de download: ${downloadLink}`);
            res.status(200).send({
                downloadLink,
                originalName: req.file.originalname,
                originalVideoInfo,
                compressedVideoInfo
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.log("[88] Erro:", error.message);
                res.status(500).send(error.message);
            }
            else {
                console.log('[91] Ocorreu um erro desconhecido');
                res.status(500).send('Ocorreu um erro desconhecido');
            }
        }
        finally {
            fs_1.default.unlinkSync(tempInputPath);
        }
    });
}
function download(req, res) {
    console.log('[CC]:102 Iniciando download do arquivo');
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
