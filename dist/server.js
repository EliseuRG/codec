"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = void 0;
//server.ts
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const ws_1 = __importDefault(require("ws"));
const CodecRoutes_1 = __importDefault(require("./routers/CodecRoutes"));
const SynthRoutes_1 = __importDefault(require("./routers/SynthRoutes"));
const AudioCodecRoutes_1 = __importDefault(require("./routers/AudioCodecRoutes"));
const app = (0, express_1.default)();
exports.wss = new ws_1.default.Server({ port: 8081 });
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(CodecRoutes_1.default);
app.use(AudioCodecRoutes_1.default);
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; media-src 'self' blob:; img-src 'self'; style-src 'self' 'unsafe-inline'");
    next();
});
app.use('/api/synth', SynthRoutes_1.default);
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
app.get('/sintetizador-code.html', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'SintetizadorCodec.html'));
});
app.get('/video-codec.html', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'VideoCodec.html'));
});
app.get('/audio-codec.html', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'AudioCodec.html'));
});
app.listen(31103, () => {
    console.log('Servidor rodando na porta 31103');
});
exports.wss.on('connection', ws => {
    ws.on('message', message => {
        console.log(`Received message => ${message}`);
    });
    ws.on('error', error => {
        console.log('WebSocket Error: ', error);
    });
    ws.send('Hello! Message From Server!!');
});
exports.default = app;
