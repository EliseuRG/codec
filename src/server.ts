//server.ts
import express          from 'express';
import path             from 'path';
import WebSocket        from 'ws';
import codecRoutes      from './routers/CodecRoutes';
import synthRoutes      from './routers/SynthRoutes';
import audioCodecRoutes from './routers/AudioCodecRoutes';

const app = express();
export const wss = new WebSocket.Server({ port: 8081 });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(codecRoutes);
app.use(audioCodecRoutes);
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; media-src 'self' blob:; img-src 'self'; style-src 'self' 'unsafe-inline'");
  next();
});
app.use('/api/synth', synthRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/sintetizador-code.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'SintetizadorCodec.html'));
});
app.get('/video-codec.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'VideoCodec.html'));
});
app.get('/audio-codec.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'AudioCodec.html'));
});

app.listen(31103, () => {
  console.log('Servidor rodando na porta 31103');
});

wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`);
  });

  ws.on('error', error => {
    console.log('WebSocket Error: ', error);
  });

  ws.send('Hello! Message From Server!!');
});

export default app;
