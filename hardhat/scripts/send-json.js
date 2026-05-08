const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const wallets = require("../wallets/wallets");
const contracts = require("../wallets/smartcontracts");

async function main() {
    // 1. Configurações (Ajuste o endereço do contrato após o deploy)
    const CONTRACT_ADDRESS = contracts[0].address;
    const DESTINO = wallets[0].address;

    // 2. O JSON que você quer enviar (pode vir de um arquivo ou variável)
    const meuObjeto = {
        batteryId: "B0044",
        timestamp: Date.now(),
        soh: "1.22",
        u: parseFloat(0), // Garante que são números
        s2: parseFloat(0)
    };
    const jsonString = JSON.stringify(meuObjeto);

    console.log("📤 Preparando envio do JSON...");
    console.log(`📦 Payload: ${jsonString}`);

    // 3. Conectar ao contrato usando o Hardhat
    // O getContractAt busca a ABI automaticamente nos artefatos
    const contrato = await ethers.getContractAt("RegistradorDeDados", CONTRACT_ADDRESS);

    // 4. Chamar a função do Smart Contract
    console.log("⏳ Enviando transação para o Besu...");
    const tx = await contrato.enviarComDados(DESTINO, jsonString);

    // 5. Esperar a confirmação (mineração do bloco)
    const receipt = await tx.wait();

    console.log("-----------------------------------------");
    console.log("✅ Transação Confirmada!");
    console.log(`🔗 Hash: ${receipt.hash}`);
    console.log(`📏 Bloco: ${receipt.blockNumber}`);
    console.log("-----------------------------------------");
}

main().catch((error) => {
    console.error("💥 Erro ao enviar:", error);
    process.exit(1);
});
