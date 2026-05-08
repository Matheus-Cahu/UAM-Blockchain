const { ethers } = require("hardhat");
const wallets = require("../wallets/wallets");
const fs = require("fs").promises; // Usando a API de promises do fs
const csv = require("csv-parser");
const path = require("path");
const { createReadStream } = require("fs");

const datasetPath = path.join(__dirname, '..', "dataset");
// itera sobre cada arquivo chamando iterateFile.
async function iterateDataset(datasetPath) {
  const files = await fs.readdir(datasetPath);
  
  for (const file of files) {
    if (file.endsWith(".csv")) {
      const filePath = path.join(datasetPath, file);
      console.log(`\n📂 Lendo arquivo: ${file}`);
      await iterateFile(filePath, file); // Espera processar um arquivo antes de ir pro próximo
    }
  }
}

// itera sobre cada linha do arquivo chamando sendRegister.
async function iterateFile(filePath, fileName) {
  return new Promise((resolve, reject) => {
    const rows = [];
    createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", async () => {
        try {
          for (const row of rows) {
            // Adiciona metadados se necessário (ex: ID da bateria vindo do nome do arquivo)
            const register = {
              batteryId: fileName.replace(".csv", ""),
              timestamp: Date.now(),
              soh: parseFloat(row.capacity_ah),
              u: parseFloat(row.u || 0), // Garante que são números
              s2: parseFloat(row.s2 || 0)
            };
            await sendRegister(register);
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on("error", reject);
  });
}

async function sendRegister(register) {
  const wallet = wallets[0];
  const [sender] = await ethers.getSigners();

  const auditData = {
    batteryId: register.batteryId,
    timestamp: register.timestamp,
    soh: register.soh,
    u: register.u,
    s2: register.s2
  };

  const jsonString = JSON.stringify(auditData);
  const hexData = ethers.hexlify(ethers.toUtf8Bytes(jsonString));

  console.log(`\n--- Registrando Ciclo da Bateria ${register.batteryId} ---`);
  
  try {
    const tx = await sender.sendTransaction({
      to: wallet.address,
      value: ethers.parseEther("0"),
      data: hexData
    });

    console.log(`Aguardando confirmação... Hash: ${tx.hash}`);
    const receipt = await tx.wait();

    // Sincronização com o Indexador (Localhost)
    const response = await fetch("http://localhost:3001/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tx_hash: receipt.hash,
        block_number: receipt.blockNumber,
        sender: sender.address,
        payload: auditData
      })
    });

    if (response.ok) {
      console.log("✅ Dados auditados e indexados com sucesso!");
    }
  } catch (error) {
    console.error("❌ Falha ao enviar registro:", error.message);
  }
}

// Execução principal
iterateDataset(datasetPath)
  .then(() => {
    console.log("\n🚀 Todos os arquivos foram processados.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });
