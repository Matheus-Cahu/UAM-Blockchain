const { ethers } = require("hardhat");

async function main() {
  const address = "0xf17f52151ebef6c7334fad080c5704d77216b732"; // Seu endereço de destino
  const balance = await ethers.provider.getBalance(address);
  console.log(`Saldo atual: ${ethers.formatEther(balance)} ETH`);

  const latestBlock = await ethers.provider.getBlockNumber();
  
  // Vamos olhar os últimos 20 blocos um por um
  for (let i = latestBlock; i > latestBlock - 20; i--) {
    const block = await ethers.provider.getBlock(i);
    if (block.transactions.length > 0) {
      console.log(`✅ Transação encontrada no Bloco #${i}!`);
      console.log(`Hashes:`, block.transactions);
      
      // Tenta pegar o detalhe da primeira transação do bloco
      const tx = await ethers.provider.getTransaction(block.transactions[0]);
      console.log(`Detalhes da TX: De ${tx.from} para ${tx.to} | Valor: ${ethers.formatEther(tx.value)}`);
    }
  }
}

main().catch(console.error);
