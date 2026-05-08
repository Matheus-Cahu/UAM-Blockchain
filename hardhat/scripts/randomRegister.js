const { ethers } = require("hardhat");
const wallets = require("../wallets/wallets");

async function main() {
  const wallet = wallets[0];
  console.log("Enviando registro para: " + wallet.address);
  
  const amount = ethers.parseEther("0");
  const auditData = {
    timestamp: new Date().toISOString(),
    soh: Math.random(),
    u: Math.random(),
    s2: Math.random()*100 
  }
  const jsonString = JSON.stringify(auditData);
  const hexData = ethers.hexlify(ethers.toUtf8Bytes(jsonString));
  const [sender] = await ethers.getSigners();
  
  const senderBalance = await ethers.provider.getBalance(sender.address);
  console.log(`--- Iniciando Registro ---`);
  console.log(`Wallet de Origem: ${sender.address}`);

  const tx = await sender.sendTransaction({
    to: wallet.address,
    value: amount,
    data: hexData
  });

  console.log(`Aguardando confirmação...`);
  const receipt = await tx.wait();

  const receiverBalance = await ethers.provider.getBalance(wallet.address);
  console.log(`\nSucesso!`);
  console.log(`Hash da Transação: ${tx.hash}`);

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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
