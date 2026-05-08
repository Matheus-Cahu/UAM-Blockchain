const { ethers } = require("hardhat");

async function main() {
  const [sender] = await ethers.getSigners();
  const auditData = { sensor: "A1", leitura: 25.5, status: "OK" };

  // 1. Grava no Besu
  const tx = await sender.sendTransaction({
    to: sender.address, // enviando para si mesmo apenas para registro
    data: ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify(auditData))),
    gasPrice: 0
  });

  console.log("⏳ Aguardando Besu...");
  const receipt = await tx.wait();

  // 2. Envia para o Indexador (Express)
  console.log("💾 Enviando para o Indexador...");
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

  const result = await response.json();
  if (result.success) {
    console.log("✅ Sincronizado com Sucesso!");
  }
}

main().catch(console.error);
