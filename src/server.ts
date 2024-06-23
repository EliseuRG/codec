import express from 'express';
import path from 'path';
import WebSocket from 'ws';
import codecRoutes from './routers/CodecRoutes';
import synthRoutes from './routers/synthRoutes';

const app = express();
export const wss = new WebSocket.Server({ port: 8081 });

app.use(express.static(path.join(__dirname, 'public')));
app.use(codecRoutes);
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'");
  next();
});
app.use('/api/synth', synthRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/wave.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'wave.html'));
});
app.get('/codec.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'code.html'));
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
