const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000'); // substitua pelo URL do seu site

  // Seleciona o input de arquivo
  const input = await page.$('#videoUpload');

  // Configura o input de arquivo para aceitar um arquivo de um caminho especificado
  await input.uploadFile('teste.mp4');

  // Dispara o evento de mudança no input de arquivo
  await input.evaluate(input => input.dispatchEvent(new Event('change', { bubbles: true })));

  // Aguarda um pouco para que o evento seja processado
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Aguarda até que o vídeo esteja pronto para ser reproduzido
  await page.waitForFunction('document.querySelector("#videoPlayer").style.display == "block"');

  // Verifica se o upload foi bem-sucedido
  // A maneira exata de fazer isso depende de como seu servidor está configurado para responder a um upload bem-sucedido
  const video = await page.$('#videoPlayer');
  const videoSrc = await page.evaluate(video => video.src, video);
  console.log('Video src: ', videoSrc);

  await browser.close();
})();