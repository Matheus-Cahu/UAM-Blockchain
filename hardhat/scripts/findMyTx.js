const { ethers } = require("hardhat");

async function main() {
  const targetAddress = "0xf17f52151ebef6c7334fad080c5704d77216b732";
  const latestBlock = await ethers.provider.getBlockNumber();

  console.log(`🔎 Buscando histórico para ${targetAddress} até o bloco ${latestBlock}...`);

  // Vamos varrer os blocos de trás para frente, pois é mais provável estar nos recentes
  // Se não achar nada nos últimos 1000, aumente o range.
  const startBlock = 0; 
  
  for (let i = latestBlock; i >= startBlock; i--) {
    const block = await ethers.provider.getBlock(i, true);
    
    if (block.transactions.length > 0) {
      console.log(`📦 Bloco #${i} tem ${block.transactions.length} transações.`);
      
      for (const tx of block.prefetchedTransactions) {
        if (tx.to?.toLowerCase() === targetAddress.toLowerCase() || 
            tx.from?.toLowerCase() === targetAddress.toLowerCase()) {
          console.log(`\n✨ TRANSAÇÃO ENCONTRADA!`);
          console.log(`   Hash: ${tx.hash}`);
          console.log(`   De: ${tx.from}`);
          console.log(`   Para: ${tx.to}`);
          console.log(`   Valor: ${ethers.formatEther(tx.value)} ETH`);
          return; // Para na primeira que achar para teste
        }
      }
    }
    
    if (i % 100 === 0) console.log(`...ainda buscando (atualmente no bloco ${i})`);
  }
}

main().catch(console.error);
