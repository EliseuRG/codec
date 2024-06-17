import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import Jimp from 'jimp';
import sharp from 'sharp';
import { dct, idct } from 'fft.js'; // Substituindo dct-ts por fft.js
import { HuffmanTree } from 'huffman-ts';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath.path);

function DCT(X, x, N) {
    let xk = Array.from({ length: N }, () => Array(N).fill(0));

    for (let n = 0; n < N; n++) {
        xk[0][n] = x[n] / Math.sqrt(N);
    }

    for (let k = 1; k < N; k++) {
        for (let n = 0; n < N; n++) {
        xk[k][n] =
            Math.sqrt(2 / N) *
            Math.cos((k * Math.PI) / (2 * N) * (2 * n + 1)) *
            x[n];
        }
    }

    X.fill(0);

    for (let k = 0; k < N; k++) {
        for (let n = 0; n < N; n++) {
        X[k] += xk[k][n];
        }
    }
}
  
function IDCT(x, X, N) {
    let xk = Array.from({ length: N }, () => Array(N).fill(0));

    for (let n = 0; n < N; n++) {
        xk[0][n] = Math.sqrt(1 / N) * X[0]; // cos(0) = 1
    }

    for (let k = 1; k < N; k++) {
        for (let n = 0; n < N; n++) {
        xk[k][n] =
            Math.sqrt(2 / N) * X[k] * Math.cos((k * (2 * n + 1) * Math.PI) / (2 * N));
        }
    }

    x.fill(0);

    for (let k = 0; k < N; k++) {
        for (let n = 0; n < N; n++) {
        x[k] += xk[n][k]; // Note a inversão de índices aqui
        }
    }
}

function subamostragem(imagem: Jimp): Jimp {
  const largura = imagem.bitmap.width;
  const altura = imagem.bitmap.height;

  // Crie uma nova imagem com metade da resolução horizontal e vertical
  const novaImagem = new Jimp(largura / 2, altura / 2);

  // Copie cada segundo pixel na horizontal e vertical
  for (let y = 0; y < altura; y += 2) {
      for (let x = 0; x < largura; x += 2) {
      const cor = imagem.getPixelColor(x, y);
      novaImagem.setPixelColor(cor, x / 2, y / 2);
      }
  }

  return novaImagem;
}

function dividirEmBlocos(imagem: Jimp, tamanhoBloco: number): number[][][] {
    const blocos: number[][][] = [];
    for (let y = 0; y < imagem.bitmap.height; y += tamanhoBloco) {
        for (let x = 0; x < imagem.bitmap.width; x += tamanhoBloco) {
        const bloco: number[][] = [];
        for (let i = 0; i < tamanhoBloco; i++) {
            const linha: number[] = [];
            for (let j = 0; j < tamanhoBloco; j++) {
            linha.push(imagem.getPixelColor(x + j, y + i) & 0xFF); // Obtém o valor do canal Y
            }
            bloco.push(linha);
        }
        blocos.push(bloco);
        }
    }
    return blocos;
}

function quantizar(bloco: number[][], fator: number): number[][] {
  return bloco.map(linha => linha.map(valor => Math.round(valor / fator)));
}

function separarCanaisYCbCr(imagem: Jimp): [Jimp, Jimp, Jimp] {
  const bufferYCbCr = imagem.bitmap.data; // Obtém o buffer de dados da imagem

  // Cria novas imagens para cada canal
  const y = new Jimp(imagem.bitmap.width, imagem.bitmap.height);
  const cb = new Jimp(imagem.bitmap.width / 2, imagem.bitmap.height / 2); // Subamostragem 4:2:0
  const cr = new Jimp(imagem.bitmap.width / 2, imagem.bitmap.height / 2); // Subamostragem 4:2:0

  // Extrai os canais Y, Cb e Cr do buffer
  let yIndex = 0;
  let cbIndex = 0;
  let crIndex = 0;
  for (let i = 0; i < bufferYCbCr.length; i += 4) {
      y.bitmap.data[yIndex++] = bufferYCbCr[i]; // Canal Y
      if ((i / 4) % 2 === 0 && Math.floor((i / 4) / imagem.bitmap.width) % 2 === 0) {
      cb.bitmap.data[cbIndex++] = bufferYCbCr[i + 1]; // Canal Cb (subamostrado)
      cr.bitmap.data[crIndex++] = bufferYCbCr[i + 2]; // Canal Cr (subamostrado)
      }
  }

  return [y, cb, cr];
}

function upsample(imagem: Jimp): Jimp {
    const largura = imagem.bitmap.width;
    const altura = imagem.bitmap.height;

    // Crie uma nova imagem com o dobro da resolução horizontal e vertical
    const novaImagem = new Jimp(largura * 2, altura * 2);

    // Copie cada pixel para os quatro pixels correspondentes na nova imagem
    for (let y = 0; y < altura; y++) {
        for (let x = 0; x < largura; x++) {
        const cor = imagem.getPixelColor(x, y);
        novaImagem.setPixelColor(cor, x * 2, y * 2);
        novaImagem.setPixelColor(cor, x * 2 + 1, y * 2);
        novaImagem.setPixelColor(cor, x * 2, y * 2 + 1);
        novaImagem.setPixelColor(cor, x * 2 + 1, y * 2 + 1);
        }
    }

    return novaImagem;
}

function juntarCanaisYCbCr(y: Jimp, cb: Jimp, cr: Jimp): Jimp {
    const largura = y.bitmap.width;
    const altura = y.bitmap.height;
  
    // Crie uma nova imagem para armazenar os canais combinados
    const novaImagem = new Jimp(largura, altura);
  
    // Combine os canais Y, Cb e Cr em um único buffer
    const bufferY = y.bitmap.data;
    const bufferCb = cb.bitmap.data;
    const bufferCr = cr.bitmap.data;
    const novoBuffer = Buffer.alloc(largura * altura * 4); // 4 bytes por pixel (RGBA)
    let yIndex = 0;
    let cbIndex = 0;
    let crIndex = 0;
    for (let i = 0; i < novoBuffer.length; i += 4) {
      novoBuffer[i] = bufferY[yIndex++]; // Canal Y
      novoBuffer[i + 1] = bufferCb[cbIndex++]; // Canal Cb
      novoBuffer[i + 2] = bufferCr[crIndex++]; // Canal Cr
      novoBuffer[i + 3] = 255; // Canal Alpha (opacidade máxima)
    }
  
    // Defina os dados da nova imagem
    novaImagem.bitmap.data = novoBuffer;
  
    return novaImagem;
}
  
  
async function comprimirVideo(inputPath: string, outputPath: string, quality: number) {

  fs.writeFileSync('qualidade.json', JSON.stringify({ quality }));
  // Extraia os quadros do vídeo
  const quadros = await new Promise<string[]>((resolve, reject) => {
    const quadros: string[] = [];
    ffmpeg(inputPath)
      .outputOptions('-vf', 'fps=30')
      .output('%d.png')
      .on('end', () => resolve(quadros))
      .on('error', reject)
      .run();
  });

  let totalBytesOriginal = 0;
  let totalBytesComprimido = 0;

  // Processa cada quadro
  for (const quadro of quadros) {
    const imagemOriginal = await Jimp.read(quadro);
    totalBytesOriginal += imagemOriginal.bitmap.data.length;

    // 1. Conversão para YCbCr e subamostragem 4:2:0
    const [y, cb, cr] = separarCanaisYCbCr(imagemOriginal);
    const ySub = subamostragem(y);
    const cbSub = subamostragem(cb);
    const crSub = subamostragem(cr);

    // 2. DCT e quantização
    const blocosY = dividirEmBlocos(ySub, 8);
    const blocosDCT = blocosY.map(bloco => {
    const X = new Array(8 * 8).fill(0); // Array para armazenar os coeficientes DCT
    DCT(bloco.flat(), X, 8); // Aplicar a DCT
    return dividirEmBlocos(X, 8); // Redividir em blocos 8x8
    });
    const blocosQuantizados = blocosDCT.map(bloco => quantizar(bloco, quality));

    // 3. Codificação Huffman
    const coeficientes = blocosQuantizados.flat();
    const huffmanTree = new HuffmanTree();
    huffmanTree.build(coeficientes);
    const bitsComprimidos = huffmanTree.encode(coeficientes);

    // 4. Salve o quadro processado
    const bufferComprimido = Buffer.from(bitsComprimidos);
    totalBytesComprimido += bufferComprimido.length;
    await imagemOriginal.bitmap.data.set(Buffer.concat([ySub.bitmap.data, cbSub.bitmap.data, crSub.bitmap.data]));
    await imagemOriginal.writeAsync(quadro);
  }

  // Remonte os quadros em um vídeo
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input('*.png')
      .inputFPS(30)
      .output(outputPath)
      .outputOptions('-c:v', 'libx264', '-crf', quality.toString())
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  return { original: totalBytesOriginal, comprimido: totalBytesComprimido };
}


async function lerBitsComprimidos(quadroPath: string): Promise<string> {
  const data = await fs.promises.readFile(quadroPath, 'utf-8');
  const jsonData = JSON.parse(data);
  return jsonData.bitsComprimidos;
}

async function lerHuffmanTree(quadroPath: string): Promise<HuffmanTree> {
  const data = await fs.promises.readFile(quadroPath, 'utf-8');
  const jsonData = JSON.parse(data);
  const huffmanTree = new HuffmanTree();
  huffmanTree.fromJSON(jsonData.huffmanTree); // Supondo que HuffmanTree tenha um método fromJSON
  return huffmanTree;
}

function juntarBlocos(blocos: number[][][], largura: number, altura: number): Jimp {
    const novaImagem = new Jimp(largura, altura);
  
    for (let i = 0; i < blocos.length; i++) {
      const bloco = blocos[i];
      const x = (i % (largura / 8)) * 8; // Calcula a posição x do bloco
      const y = Math.floor(i / (largura / 8)) * 8; // Calcula a posição y do bloco
  
      for (let j = 0; j < 8; j++) {
        for (let k = 0; k < 8; k++) {
          const valor = bloco[j][k];
          novaImagem.setPixelColor(valor << 24, x + k, y + j); // Define a cor do pixel (apenas canal Y)
        }
      }
    }
  
    return novaImagem;
  }

async function descomprimirVideo(inputPath: string, outputPath: string, quality: number) {

    const qualidadeData = JSON.parse(fs.readFileSync('qualidade.json', 'utf-8'));
    const qualidade = qualidadeData.quality;

    // 1. Extrair quadros do vídeo comprimido (similar à compressão)
    const quadros = await new Promise<string[]>((resolve, reject) => {
      const quadros: string[] = [];
      ffmpeg(inputPath)
        .outputOptions('-vf', 'fps=30')
        .output('%d.png')
        .on('end', () => resolve(quadros))
        .on('error', reject)
        .run();
    });
  
    // 2. Processar cada quadro
    for (const quadro of quadros) {
      const imagemComprimida = await Jimp.read(quadro);
  
      // 3. Ler os bits comprimidos e informações de Huffman (você precisará ter salvo isso durante a compressão)
      const bitsComprimidos = await lerBitsComprimidos(quadro); // Implemente esta função para ler os bits do arquivo
      const huffmanTree = await lerHuffmanTree(quadro); // Implemente esta função para ler a árvore de Huffman
      
      // 4. Decodificação Huffman
      const coeficientesQuantizados = huffmanTree.decode(bitsComprimidos);
  
      // 5. Desquantização
      const blocosDCT = coeficientesQuantizados.map(bloco => bloco.map(valor => valor * quality)); // quality é o mesmo usado na compressão
  
      // 6. IDCT (Inversa da DCT)
      const blocosY = blocosDCT.map(bloco => {
        const x = new Array(8 * 8).fill(0); // Array para armazenar os valores originais
        IDCT(bloco.flat(), x, 8); // Aplicar a IDCT
    
        // Criar uma nova imagem Jimp a partir dos valores do array x
        const imagemY = new Jimp(8, 8);
        imagemY.scan(0, 0, 8, 8, (x, y, idx) => {
        const valor = x[y * 8 + x]; // Obter o valor do pixel do array x
        imagemY.bitmap.data[idx] = valor; // Definir o valor do pixel na imagem Jimp
        imagemY.bitmap.data[idx + 1] = valor; // Definir o valor do pixel na imagem Jimp
        imagemY.bitmap.data[idx + 2] = valor; // Definir o valor do pixel na imagem Jimp
        imagemY.bitmap.data[idx + 3] = 255; // Definir o canal alfa como 255 (opacidade total)
        });
    
        return dividirEmBlocos(imagemY, 8); // Redividir em blocos 8x8
      });
  
      // 7. Juntar os blocos em uma imagem Y
      const yDescomprimida = juntarBlocos(blocosY, imagemComprimida.bitmap.width / 2, imagemComprimida.bitmap.height / 2); // Tamanho original / 2 devido à subamostragem
  
      // 8. Upsampling dos canais de crominância (Cb e Cr)
      const cbUpsampled = upsample(imagemComprimida.clone()); // Remove hasAlpha(false)
      const crUpsampled = upsample(imagemComprimida.clone()); // Remove hasAlpha(false)

  
      // 9. Combinar os canais Y, Cb e Cr para formar a imagem descomprimida
      const imagemDescomprimida = juntarCanaisYCbCr(yDescomprimida, cbUpsampled, crUpsampled);
  
      // 10. Salvar o quadro descomprimido
      await imagemDescomprimida.writeAsync(quadro);
    }
  
    // 11. Remontar os quadros em um vídeo (igual à compressão)
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input('*.png')
        .inputFPS(30)
        .output(outputPath)
        .outputOptions('-c:v', 'libx264')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
  

async function compararCodecs(inputPath: string) {
  // ... (mesma implementação da função compararCodecs fornecida anteriormente)
}

// Execução e análise
const inputPath = 'video_original.mp4';
compararCodecs(inputPath);

