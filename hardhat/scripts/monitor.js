const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
// Certifique-se que este caminho e arquivo existam
const contracts = require("../wallets/smartcontracts");

async function main() {
    const RPC_WS_URL = "ws://127.0.0.1:8546";
    const CONTRACT_ADDRESS = contracts[0].address;
    const INDEXER_URL = "http://localhost:3001/registrar";

    // 1. Localizar ABI
    const contractArtifactPath = path.join(
        __dirname,
        "../artifacts/contracts/RegistradorDeDados.sol/RegistradorDeDados.json"
    );

    if (!fs.existsSync(contractArtifactPath)) {
        throw new Error("Artefato do contrato não encontrado. Rode npx hardhat compile.");
    }

    const contractArtifact = JSON.parse(fs.readFileSync(contractArtifactPath, "utf8"));
    const abi = contractArtifact.abi;

    // 2. Conectar via WebSocket
  // No monitor.js, altere a linha do provider para:
const provider = new ethers.WebSocketProvider(RPC_WS_URL, undefined, {
    staticNetwork: true 
});
    const contrato = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

    console.log("-----------------------------------------");
    console.log("🚀 Monitor/Relay rodando no Besu...");
    console.log(`📍 Contrato: ${CONTRACT_ADDRESS}`);
    console.log(`🔗 Indexador: ${INDEXER_URL}`);
    console.log("-----------------------------------------");

    // 3. Escuta de Eventos
    // No v6, os argumentos do evento vêm antes do objeto de log
    contrato.on("RegistroRealizado", async (destino, dadosJson, eventLog) => {
        console.log("\n🔔 EVENTO DETECTADO NA BLOCKCHAIN");
        
        const txHash = eventLog.log.transactionHash;
        const blockNumber = eventLog.log.blockNumber;

        console.log(`🔗 TX: ${txHash}`);

        // 4. Enviar para o Indexador (Webhook)
        try {
            const response = await fetch(INDEXER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tx_hash: txHash,
                    block_number: Number(blockNumber), // Convertendo BigInt para Number/String
                    sender: destino,
                    payload: dadosJson 
                })
            });

            if (response.ok) {
                console.log("✅ Dados enviados ao indexador com sucesso!");
            } else {
                console.error(`⚠️ Indexador retornou status: ${response.status}`);
            }
        } catch (error) {
            console.error("❌ Erro ao conectar com o indexador:", error.message);
        }
    });

    // Mantém o processo rodando
    process.on('SIGINT', () => {
        provider.destroy();
        process.exit();
    });
}

// Verifique se o final está exatamente assim:
main().then(() => {
    // Isso mantém o processo vivo para o WebSocket
    console.log("👀 Aguardando eventos...");
}).catch((error) => {
    console.error("💥 Erro fatal no monitor:", error);
    process.exit(1);
});
