// server.ts
import express     from 'express';
import path        from 'path';
import WebSocket   from 'ws';
import codecRoutes from './router/CodecRoutes';

const app = express();
export const wss = new WebSocket.Server({ port: 8080 }); // Adicione a palavra-chave 'export'

app.use(express.static(path.join(__dirname, 'public')));
app.use(codecRoutes);
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'");
  next();
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`)
  });

  ws.on('error', error => {
    console.log('WebSocket Error: ', error);
  });

  ws.send('Hello! Message From Server!!');
});