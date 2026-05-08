const { ethers } = require("hardhat");
const readline = require("readline");
const wallets = require("../wallets/wallets");
const contracts = require("../wallets/smartcontracts");

function perguntar(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
    }));
}

async function calcularProximoTVDLAR(novaEntrada) {
    const { batteryId, soh: novoSoh } = novaEntrada;
    const API_URL = `http://localhost:3001/historico/${batteryId}`;

    try {
        console.log(`\n[${batteryId}] Buscando histórico na API`);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Erro ao buscar histórico: ${response.status}`);

        const historico = await response.json();

        let serieY = historico
            .map(item => item.payload.soh)
            .filter(val => val !== null && !isNaN(val));

        serieY.push(parseFloat(novoSoh));

        if (serieY.length < 3) {
            console.log(`Pontos insuficientes (${serieY.length}). Mínimo necessário: 3.`);
            return null;
        }

        const serieC = [];
        for (let i = 1; i < serieY.length; i++) {
            serieC.push(serieY[i] / serieY[i - 1]);
        }

        let numU = 0, denU = 0;
        for (let i = 1; i < serieC.length; i++) {
            numU += serieC[i] * serieC[i - 1];
            denU += serieC[i - 1] * serieC[i - 1];
        }

        if (denU === 0) return null;
        const uResult = numU / denU;

        let somaResiduos = 0;
        for (let i = 1; i < serieC.length; i++) {
            somaResiduos += Math.pow(serieC[i] - (uResult * serieC[i - 1]), 2);
        }
        const sigma2Result = somaResiduos / (serieC.length - 1);

        return {
            batteryId,
            timestamp: Date.now(),
            soh: novoSoh.toString(),
            u: parseFloat(uResult.toFixed(6)),
            s2: parseFloat(sigma2Result.toFixed(8))
        };

    } catch (err) {
        console.error(`Erro no cálculo:`, err.message);
        return null;
    }
}

async function main() {
    console.log("--- Registro de Telemetria eVTOL ---");
    const batteryId = await perguntar("ID da bateria: ");
    const sohInput = await perguntar("Capacidade registrada (Ah): ");

    if (!batteryId || !sohInput) {
        console.error("Erro: ID e SoH são obrigatórios.");
        process.exit(1);
    }

    const entrada = {
        batteryId: batteryId.trim(),
        soh: parseFloat(sohInput.replace(',', '.'))
    };

    const resultadoTvdlar = await calcularProximoTVDLAR(entrada);

    if (!resultadoTvdlar) {
        console.log("Cancelando envio: falha no processamento.");
        return;
    }

    const CONTRACT_ADDRESS = contracts[0].address;
    const DESTINO = wallets[0].address;
    const jsonString = JSON.stringify(resultadoTvdlar);

    // console.log("\n📤 Preparando envio para Blockchain...");
    // console.log(`📦 Payload: ${jsonString}`);

    const contrato = await ethers.getContractAt("RegistradorDeDados", CONTRACT_ADDRESS);
    
    const tx = await contrato.enviarComDados(DESTINO, jsonString);

    const receipt = await tx.wait();

    console.log("-----------------------------------------");
    console.log("Transação Confirmada com TVDLAR!");
    console.log(`Hash: ${receipt.hash}`);
    console.log(`Bloco: ${receipt.blockNumber}`);
    console.log("-----------------------------------------");
}

main().catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
});
