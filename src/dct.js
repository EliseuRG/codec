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
  
  // Exemplo de Uso
  let x = [1, 2, 3, 4]; // Sinal de entrada
  let N = x.length;
  let X = new Array(N); // Resultado da DCT
  let x_rec = new Array(N); // Sinal recuperado após IDCT
  
  DCT(X, x, N);
  IDCT(x_rec, X, N);
  
  console.log("Sinal original:", x);
  console.log("DCT:", X);
  console.log("Sinal recuperado:", x_rec);
  