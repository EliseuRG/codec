document.addEventListener('DOMContentLoaded', function() {

    // Inicializa o contexto de áudio
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
    // Variáveis globais para armazenar o oscilador e o analyser
    let oscillator = null;
    let analyser = null;
  
    // Tamanho do buffer para o analyser
    const bufferLength = 2048;
    
    // Função para reproduzir o tom de notificação e desenhar a forma de onda
    function playNotificationTone(waveType, frequency, amplitude) {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
  
      if (analyser) {
        analyser.disconnect();
      }
  
      oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
  
      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(amplitude, audioCtx.currentTime);
  
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
  
      // Inicializa o AnalyserNode para a forma de onda
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = bufferLength; // Set FFT size
  
      // Conecta o oscillator ao analyser
      oscillator.connect(analyser);
  
      // Cria um array de dados para receber a forma de onda
      const dataArray = new Uint8Array(bufferLength);
  
      // Começa a capturar dados do analyser
      analyser.getByteTimeDomainData(dataArray);
  
      // Aguarda 10ms para iniciar a animação do waveform
      setTimeout(() => {
        requestAnimationFrame(drawWaveform);
      }, 10);
  
      // Toca o som por 0.25 segundo
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.25);
    }
  
    // Função para desenhar a forma de onda no canvas
    function drawWaveform() {
      if (!analyser) return;
  
      const canvas = document.getElementById('waveformCanvas');
      const canvasCtx = canvas.getContext('2d');
  
      // Coleta os dados da forma de onda
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);
  
      // Limpa o canvas e desenha a forma de onda atualizada
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.fillStyle = '#ffffff';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = '#4CAF50';
      canvasCtx.beginPath();
  
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
  
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
  
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }
  
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
  
      // Continua a animação
      requestAnimationFrame(drawWaveform);
    }
  
    // Tocar tom de notificação ao carregar a página
    playNotificationTone('sine', 50, 1); // Exemplo com tipo de onda 'sine', frequência 440 Hz e amplitude 1
  
    // Manipulador de evento para o formulário
    document.getElementById('synth-form').addEventListener('submit', function(event) {
      event.preventDefault();
      const waveType = document.getElementById('waveType').value;
      const frequency = parseFloat(document.getElementById('frequency').value);
      const amplitude = parseFloat(document.getElementById('amplitude').value);
  
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
  
      if (analyser) {
        analyser.disconnect();
      }
  
      oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = bufferLength; // Set FFT size
  
      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(amplitude, audioCtx.currentTime);
  
      oscillator.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioCtx.destination);
  
      // Toca o som por 1 segundo
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    });
  
  });
  