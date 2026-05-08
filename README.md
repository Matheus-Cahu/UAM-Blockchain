🔋 eVTOL Battery SoH - Blockchain & Telemetry

Este repositório contém a infraestrutura para o registro e auditoria de dados de telemetria de baterias (State of Health - SoH) utilizando Hyperledger Besu e Smart Contracts para garantir a integridade dos dados de ciclo de carga e descarga.
🏗️ Arquitetura do Sistema

O fluxo de dados segue o seguinte caminho:

    Source: Scripts lêem dados brutos de datasets CSV.

    Blockchain: Os dados são encapsulados em JSON e enviados via Smart Contract para a rede Besu.

    Indexing: Um monitor em tempo real captura os eventos da rede e alimenta um banco de dados (Indexador) para consulta rápida.

🚀 Como Executar
1. Inicializar a Rede (Besu)

Navegue até o diretório da rede e execute o script de inicialização:
Bash

cd quorum-test-network/
./run

2. Configurar o Hardhat

Na pasta hardhat/, instale as dependências e compile os contratos:
Bash

npm install
npx hardhat compile

📂 Estrutura do Projeto
📜 Smart Contracts & Scripts (/hardhat)

Pasta principal contendo a lógica de interação com a EVM.
Script	Descrição
deployBasicRegister.js	Realiza o deploy do contrato principal de registro de telemetria.
monitor.js	Relay de Eventos. Escuta a rede via WebSocket e repassa transações para o indexador.
send-json.js	Script cliente para envio de registros individuais para o contrato.
registerSoHDataset.js	Ingestão em Massa. Lê arquivos em /dataset e registra os ciclos na blockchain.
faucet.js	Distribui fundos (ETH) para as carteiras de teste.
fetchTransaction.js	Utilitário para auditoria de dados via Hash da transação.
listTransactions.js	Exibe o histórico de atividade da chain.
generateWallet.js	Gera novas credenciais (Endereço/Private Key) para experimentação.
📊 Dados (/dataset)

Contém arquivos .csv pré-processados com extrações de capacidade por ciclo de bateria, servindo como input para os scripts de registro.
🔑 Configurações (/wallets)

Arquivos de suporte para gestão de endereços:

    wallets.js: Lista de carteiras de validadores e usuários.

    smartcontracts.js: Endereços dos contratos deployed na rede Besu.

🛠️ Tecnologias Utilizadas

    Hyperledger Besu: Cliente Ethereum enterprise para rede privada.

    Hardhat: Ambiente de desenvolvimento para Smart Contracts.

    Ethers.js (v6): Biblioteca para interação com a rede via JSON-RPC e WebSockets.

    Node.js: Runtime para os scripts de monitoramento e ingestão.

📈 Modelagem & Análise (Diretório TVDLAR/)

Este diretório contém a implementação do algoritmo TVDLAR (Time-Varying Discrete Linear Auto-Regressive), utilizado para estimar a saúde das baterias e identificar padrões de degradação.
🧪 Scripts de Processamento
Script	Função
tvdlar.py	Motor de Processamento. Itera sobre os dados brutos nos diretórios /1 a /6, calcula os parâmetros u e σ2 para cada bateria e consolida os resultados em um CSV.
tvdlarAnalysis.py	Ferramenta de Diagnóstico. Gera visualizações iterativas de u (taxa de variação) e σ2 (estabilidade), permitindo a identificação visual de outliers e baterias danificadas.
tvdlar_linear_test.py	Validação. Script de teste com dados sintéticos (mockados) para validar a integridade matemática do algoritmo TVDLAR.
# UAM-Blockchain
