const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  const hash = process.argv[2];

  console.log(`Buscando registro: ${hash}...`);

  try {
    const txDetails = await provider.getTransaction(hash);

    if (!txDetails) {
      console.log("Registro não encontrado");
      return;
    }

    if (txDetails.data && txDetails.data !== "0x") {
      const rawData = ethers.toUtf8String(txDetails.data);
      const decodedJson = JSON.parse(rawData);
      
      console.log("\nRegistro Encontrado!");
      console.log("-----------------------------------------");
      console.log("Bloco:", txDetails.blockNumber);
      console.log("Remetente:", txDetails.from);
      console.log("Dados (Payload):", decodedJson);
      console.log("-----------------------------------------");
    } else {
      console.log("ℹ️ Transação encontrada, mas não contém dados (payload).");
    }

  } catch (error) {
    console.error("Erro ao buscar transação:", error.message);
  }
}

main();
