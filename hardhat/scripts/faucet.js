const { ethers } = require("hardhat");
const wallets = require("../wallets/wallets");

async function main() {
  // Endereço que vai receber os fundos (mude para o seu endereço da MetaMask, por exemplo)
  const wallet = wallets[1];
  console.log("Enviando para: " + wallet.address);
  
  // Valor a enviar (ex: 10 ETH/Tokens nativos)
  const amount = ethers.parseEther("0");
  const auditData = {
    timestamp: new Date().toISOString(),
    soh: 0.856,
    u: 0.982,
    s2: 11.231
  }
  const jsonString = JSON.stringify(auditData);
  const hexData = ethers.hexlify(ethers.toUtf8Bytes(jsonString));
  // Pegamos a primeira conta (que o Quickstart já deixa rica por padrão)
  const [sender] = await ethers.getSigners();
  
  const senderBalance = await ethers.provider.getBalance(sender.address);
  console.log(`--- Iniciando Faucet ---`);
  console.log(`Conta de Origem: ${sender.address}`);
  console.log(`Saldo atual da Origem: ${ethers.formatEther(senderBalance)} ETH`);

  console.log(`\nEnviando ${ethers.formatEther(amount)} ETH para: ${wallet.address}...`);

  // Enviando a transação
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
  console.log(`Novo saldo do Destinatário: ${ethers.formatEther(receiverBalance)} ETH`);

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
