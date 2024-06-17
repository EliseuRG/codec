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
exports.download = exports.compress = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CodecService_1 = require("../service/CodecService");
const progress_stream_1 = __importDefault(require("progress-stream"));
const server_1 = require("../server"); // Importe o 'wss' do arquivo 'server.ts'
const ws_1 = __importDefault(require("ws")); // Importe WebSocket se você planeja usá-lo
const codecService = new CodecService_1.CodecService();
function compress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.file || !req.file.buffer) {
            res.status(400).send('Nenhum arquivo enviado');
            return;
        }
        const inputBuffer = req.file.buffer; // Acesse o conteúdo do arquivo diretamente do buffer em memória
        const tempInputPath = `src/temp/${req.file.originalname}`; // Caminho temporário para o arquivo de entrada
        const outputPath = `src/compressed/${req.file.originalname}`; // Caminho do arquivo de saída
        try {
            // Salvar o buffer de entrada em um arquivo temporário para obter informações
            yield fs_1.default.promises.writeFile(tempInputPath, inputBuffer);
            // Obtenha as informações do vídeo original
            const originalVideoInfo = yield codecService.getVideoInfo(tempInputPath);
            // Crie um stream de progresso
            const progressStream = (0, progress_stream_1.default)({
                length: req.file.size,
                time: 100 /* ms */
            });
            // Configure a resposta para SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            progressStream.on('progress', function (p) {
                // Envie um evento de progresso para todos os clientes WebSocket
                server_1.wss.clients.forEach(client => {
                    if (client.readyState === ws_1.default.OPEN) {
                        client.send(JSON.stringify(p));
                    }
                });
            });
            // Use o stream de progresso ao chamar o método compressVideo
            yield codecService.compressVideo(inputBuffer, outputPath, progressStream);
            // Obtenha as informações do vídeo comprimido
            const compressedVideoInfo = yield codecService.getVideoInfo(outputPath);
            // Remova o arquivo temporário
            yield fs_1.default.promises.unlink(tempInputPath);
            // Retorne o link de download e as informações dos vídeos como resposta
            res.status(200).send({
                downloadLink: `/download/${req.file.originalname}`,
                originalName: req.file.originalname,
                originalVideoInfo,
                compressedVideoInfo
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.log("[61] Erro:", error.message);
                res.status(500).send(error.message);
            }
            else {
                console.log('[64] Ocorreu um erro desconhecido');
                res.status(500).send('Ocorreu um erro desconhecido');
            }
        }
    });
}
exports.compress = compress;
function download(req, res) {
    const filename = req.params.filename;
    const directoryPath = path_1.default.resolve(__dirname, '..', '..', 'src/compressed');
    const fullPath = path_1.default.join(directoryPath, filename);
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.download(fullPath, filename, (err) => {
        if (err) {
            console.error('Não foi possível baixar o arquivo:', err);
            res.status(500).send('Erro ao baixar o arquivo');
        }
    });
}
exports.download = download;
