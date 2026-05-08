/**
 * Calcula o TVDLAR para uma bateria específica considerando uma nova medição.
 * @param {Object} novaEntrada - Objeto contendo { batteryId, soh }
 */
async function calcularProximoTVDLAR(novaEntrada) {
    const { batteryId, soh: novoSoh } = novaEntrada;
    const API_URL = `http://localhost:3001/historico/${batteryId}`;

    try {
        // 1. Busca o histórico existente na API
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Erro ao buscar histórico: ${response.status}`);

        const historico = await response.json();

        // 2. Extrai a série de SoH do histórico e adiciona a nova medição ao final
        let serieY = historico
            .map(item => item.payload.soh)
            .filter(val => val !== null && !isNaN(val));

        serieY.push(parseFloat(novoSoh));

        // 3. Validação de tamanho mínimo
        if (serieY.length < 3) {
            console.log(`[${batteryId}] Pontos insuficientes (${serieY.length}). Mínimo necessário: 3.`);
            return null;
        }

        // 4. Cálculo da serieC (Razão entre capacidades consecutivas)
        const serieC = [];
        for (let i = 1; i < serieY.length; i++) {
            serieC.push(serieY[i] / serieY[i - 1]);
        }

        // 5. Estimação do parâmetro 'u' (Modelo AR1)
        let numU = 0, denU = 0;
        for (let i = 1; i < serieC.length; i++) {
            numU += serieC[i] * serieC[i - 1];
            denU += serieC[i - 1] * serieC[i - 1];
        }

        if (denU === 0) return null;
        const uResult = numU / denU;

        // 6. Cálculo do sigma² (s2) - Variância dos resíduos
        let somaResiduos = 0;
        for (let i = 1; i < serieC.length; i++) {
            somaResiduos += Math.pow(serieC[i] - (uResult * serieC[i - 1]), 2);
        }
        const sigma2Result = somaResiduos / (serieC.length - 1);

        return {
            batteryId,
            u: parseFloat(uResult.toFixed(6)),
            s2: parseFloat(sigma2Result.toFixed(8)),
            soh: novoSoh,
            timestamp: Date.now(),
            totalPontos: serieY.length
        };

    } catch (err) {
        console.error(`[${batteryId}] Erro:`, err.message);
        return null;
    }
}

// --- Lógica de Captura de Argumentos ---

// process.argv[2] é o primeiro argumento após o nome do arquivo
// process.argv[3] é o segundo
const batteryIdArg = process.argv[2];
const sohArg = process.argv[3];

if (!batteryIdArg || !sohArg) {
    console.log("\nExemplo de uso:");
    console.log("node tvdlar.js B0025 1.560780323615\n");
    process.exit(1);
}

const entrada = {
    batteryId: batteryIdArg,
    soh: parseFloat(sohArg)
};

// Execução
calcularProximoTVDLAR(entrada).then(resultado => {
    if (resultado) {
        console.log(JSON.stringify(resultado, null, 2));
    }
});
