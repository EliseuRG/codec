"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// CodecRoutes.ts
const express_1 = __importDefault(require("express"));
const CodecController_1 = require("../controllers/CodecController");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
// Configuração do multer para armazenar em memória
const memoryStorage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: memoryStorage,
    limits: { fileSize: 10000000 } // Limite de 10MB
});
router.post('/compress', upload.single('video'), CodecController_1.compress);
router.get('/download/video/:filename', CodecController_1.download);
router.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).send('Arquivo muito grande: Limite de 10MB');
    }
    else {
        console.error('Erro na compressão:', err);
        res.status(500).send('Erro na compressão');
    }
});
exports.default = router;
