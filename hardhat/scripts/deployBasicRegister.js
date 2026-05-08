const hre = require("hardhat");

async function main(){
  console.log("Deploy do SC de registro básico");
  const Registrador = await hre.ethers.getContractFactory("RegistradorDeDados");
  const contrato = await Registrador.deploy();

  await contrato.waitForDeployment();

  console.log('Contrato deployado com sucesso!');
  console.log(`Endereço do contrato: ${await contrato.getAddress()}`);
}

main().catch((error) => {
  console.log(error);
  process.exitCode=1;
});
