"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const ws_1 = __importDefault(require("ws"));
const CodecRoutes_1 = __importDefault(require("./routers/CodecRoutes"));
const synthRoutes_1 = __importDefault(require("./routers/synthRoutes"));
const app = (0, express_1.default)();
exports.wss = new ws_1.default.Server({ port: 8081 });
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(CodecRoutes_1.default);
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'");
    next();
});
app.use('/api/synth', synthRoutes_1.default);
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
app.get('/wave.html', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'wave.html'));
});
app.get('/codec.html', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'code.html'));
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
