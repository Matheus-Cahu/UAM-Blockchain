import scipy.io as sio
import pandas as pd
import matplotlib.pyplot as plt
import os
import glob

# 1. Configuração das pastas (ajuste os nomes se necessário)
folders = ['1', '2', '3', '4', '5', '6']

for folder in folders:
    # Busca todos os arquivos .mat dentro da pasta específica
    files = glob.glob(os.path.join(folder, "*.mat"))
    
    for file_path in files:
        try:
            print(f"Processando: {file_path}")
            
            # 2. Carrega os dados
            data = sio.loadmat(file_path)
            # Filtra chaves internas do MATLAB
            main_key = [k for k in data.keys() if not k.startswith('__')][0]
            cycles = data[main_key][0, 0]['cycle'][0]

            capacity_history = []

            # 3. Extrai a capacidade apenas dos ciclos de descarga
            for i, cycle in enumerate(cycles):
                if cycle['type'][0] == 'discharge':
                    measurements = cycle['data'][0, 0]
                    if 'Capacity' in measurements.dtype.names:
                        # Extração segura para o formato struct do scipy.io
                        cap = measurements['Capacity'][0][0]
                        capacity_history.append({
                            'cycle_id': i + 1,
                            'capacity_ah': cap
                        })

            if not capacity_history:
                print(f"Aviso: Nenhuma série de capacidade encontrada em {file_path}")
                continue

            # 4. Cria o DataFrame
            df_cap = pd.DataFrame(capacity_history)

            # 5. Plotagem
            plt.figure(figsize=(10, 6))
            plt.plot(df_cap['cycle_id'], df_cap['capacity_ah'], 
                     marker='o', linestyle='-', markersize=4, color='#e67e22')

            # Linha de EOL (End of Life) conforme os READMEs (1.4 ou 1.6 dependendo do set)
            plt.axhline(y=1.4, color='red', linestyle='--', label='EOL (1.4 Ah)')
            
            plt.title(f'Degradação da Capacidade - {main_key} ({folder})')
            plt.xlabel('ID do Ciclo (Sequencial no arquivo .mat)')
            plt.ylabel('Capacidade (Ah)')
            plt.legend()
            plt.grid(True, alpha=0.3)

            # 6. Salva o gráfico na mesma pasta do arquivo .mat
            # Troca a extensão .mat por .png
            output_path = file_path.replace('.mat', '_degradation.png')
            plt.savefig(output_path, dpi=150)
            plt.close() # Fecha a figura para liberar memória
            
            print(f"Sucesso: Gráfico salvo em {output_path}")

        except Exception as e:
            print(f"Erro ao processar {file_path}: {e}")

print("\nProcessamento concluído.")
