const { ethers } = require("hardhat");
const wallets = require("../wallets/wallets");
const contracts = require("../wallets/smartcontracts");
const fs = require("fs");
const path = require("path");
const glob = require("glob");

// --- CONFIGURAÇÕES ---
const FOLDERS = ['../TVDLAR/1', '../TVDLAR/2', '../TVDLAR/3', '../TVDLAR/4', '../TVDLAR/5', '../TVDLAR/6'];

/**
 * Busca um dataset aleatório e extrai uma subsequência de dados para o cálculo
 */
async function obterDadosDoArquivo() {
    const folder = FOLDERS[Math.floor(Math.random() * FOLDERS.length)];
    const files = glob.sync(path.join(folder, "*_discharge.csv"));

    if (files.length === 0) return null;

    const randomFile = files[Math.floor(Math.random() * files.length)];
    const batteryId = path.basename(randomFile).replace('_discharge.csv', '');

    const content = fs.readFileSync(randomFile, 'utf8');
    // Filtra linhas vazias e cabeçalho, converte para números
    const todasCapacidades = content.split('\n')
        .slice(1) 
        .map(line => line.split(',')[1])
        .map(val => parseFloat(val))
        .filter(val => !isNaN(val));

    if (todasCapacidades.length < 10) return null;

    // Sorteia um ponto de corte aleatório para simular que a bateria está em algum momento da vida
    // Garantimos pelo menos 5 pontos para o histórico e 1 para a nova entrada
    const pontoCorte = Math.floor(Math.random() * (todasCapacidades.length - 5)) + 5;
    
    const historico = todasCapacidades.slice(0, pontoCorte);
    const novaEntradaSoh = todasCapacidades[pontoCorte];

    return { batteryId, historico, novaEntradaSoh };
}

/**
 * Calcula TVDLAR usando apenas os dados extraídos do arquivo
 */
function calcularTVDLARLocal(dados) {
    const { batteryId, historico, novaEntradaSoh } = dados;
    
    // Unimos o histórico com a nova leitura
    let serieY = [...historico, novaEntradaSoh];

    // 1. Cálculo das Razões (C)
    const serieC = [];
    for (let i = 1; i < serieY.length; i++) {
        serieC.push(serieY[i] / serieY[i - 1]);
    }

    // 2. Estimativa de u (Mínimos Quadrados)
    let numU = 0, denU = 0;
    for (let i = 1; i < serieC.length; i++) {
        numU += serieC[i] * serieC[i - 1];
        denU += serieC[i - 1] * serieC[i - 1];
    }

    if (denU === 0) return null;
    const uResult = numU / denU;

    // 3. Cálculo de Sigma² (Variância dos Resíduos)
    let somaResiduos = 0;
    for (let i = 1; i < serieC.length; i++) {
        somaResiduos += Math.pow(serieC[i] - (uResult * serieC[i - 1]), 2);
    }
    const sigma2Result = somaResiduos / (serieC.length - 1);

    return {
        batteryId,
        timestamp: Date.now(),
        soh: novaEntradaSoh.toFixed(4),
        u: parseFloat(uResult.toFixed(8)),
        s2: parseFloat(sigma2Result.toFixed(10))
    };
}

async function stressTestOffline() {
    const TARGET_TRANSACOES = 1000; 
    const CONTRACT_ADDRESS = contracts[0].address;
    const DESTINO = wallets[0].address;
    const contrato = await ethers.getContractAt("RegistradorDeDados", CONTRACT_ADDRESS);

    console.log(`🚀 Stress Test: Lendo arquivos e enviando para Blockchain...`);
    
    const metricas = [];
    const startTimeTotal = Date.now();
    let sucessos = 0;

    while (sucessos < TARGET_TRANSACOES) {
        try {
            const dados = await obterDadosDoArquivo();
            if (!dados) continue;

            const payloadObj = calcularTVDLARLocal(dados);
            if (!payloadObj) continue;

            const jsonString = JSON.stringify(payloadObj);
            const startTx = Date.now();

            process.stdout.write(`[${sucessos + 1}/${TARGET_TRANSACOES}] Enviando ${dados.batteryId}... `);
            
            const tx = await contrato.enviarComDados(DESTINO, jsonString);
            const receipt = await tx.wait();
            
            const latencia = (Date.now() - startTx) / 1000;
            console.log(`✅ OK (${latencia}s)`);

            metricas.push({ latencia, gasUsed: receipt.gasUsed.toString() });
            sucessos++;

        } catch (err) {
            console.error(`\n❌ Erro:`, err.message);
        }
    }

    // --- RELATÓRIO ---
    const tempoTotal = (Date.now() - startTimeTotal) / 1000;
    const tps = metricas.length / tempoTotal;
    const latenciaMedia = metricas.reduce((acc, m) => acc + m.latencia, 0) / metricas.length;
    const gasMedio = metricas.reduce((acc, m) => acc + BigInt(m.gasUsed), 0n) / BigInt(metricas.length);

    console.log("\n=========================================");
    console.log("📊 RESULTADOS DO BENCHMARK BLOCKCHAIN");
    console.log(`- Registros Enviados: ${sucessos}`);
    console.log(`- Tempo Total: ${tempoTotal.toFixed(2)}s`);
    console.log(`- Throughput (TPS): ${tps.toFixed(2)} tx/s`);
    console.log(`- Latência Média: ${latenciaMedia.toFixed(3)}s`);
    console.log(`- Gas Médio por Tx: ${gasMedio.toString()}`);
    console.log("=========================================");
}

stressTestOffline().catch(console.error);
