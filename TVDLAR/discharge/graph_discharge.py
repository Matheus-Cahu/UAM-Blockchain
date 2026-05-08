import pandas as pd
import matplotlib.pyplot as plt
import os
import glob

# 1. Configuração do diretório de entrada
input_dir = 'baterias_segmentadas'
output_dir = 'graficos_degradacao'

# Cria a pasta de saída para os gráficos se não existir
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 2. Busca todos os arquivos .csv na pasta segmentada
files = glob.glob(os.path.join(input_dir, "*.csv"))

print(f"Iniciando plotagem de {len(files)} baterias...")

for file_path in files:
    try:
        # Pega o nome da bateria a partir do nome do arquivo
        nome_arquivo = os.path.basename(file_path)
        bateria_id = nome_arquivo.replace('_data.csv', '').replace('_discharge.csv', '')
        
        print(f"Processando: {bateria_id}")
        
        # 3. Carrega os dados do CSV
        df = pd.read_csv(file_path)
        
        # 4. Extrai a capacidade por ciclo (apenas uma entrada por ciclo_id)
        # Usamos drop_duplicates para pegar o valor único de capacidade por ciclo
        df_cap = df[['id_cycle', 'Capacity']].drop_duplicates().dropna()
        
        if df_cap.empty:
            print(f"  ! Aviso: Dados de capacidade vazios para {bateria_id}")
            continue

        # 5. Plotagem
        plt.figure(figsize=(10, 6))
        plt.plot(df_cap['id_cycle'], df_cap['Capacity'], 
                 marker='o', linestyle='-', markersize=4, color='#e67e22', label='Capacidade Real')

        # Define o EOL com base no nome da bateria (conforme READMEs)
        # Baterias 33-40 têm EOL de 1.6Ah, as outras 1.4Ah
        eol_value = 1.6 if any(x in bateria_id for x in ['B0033', 'B0034', 'B0036', 'B0038', 'B0039', 'B0040']) else 1.4
        plt.axhline(y=eol_value, color='red', linestyle='--', label=f'EOL ({eol_value} Ah)')

        plt.title(f'Curva de Degradação de Capacidade - {bateria_id}')
        plt.xlabel('Número do Ciclo')
        plt.ylabel('Capacidade (Ah)')
        plt.legend()
        plt.grid(True, alpha=0.3)

        # 6. Salva o gráfico na pasta de saída
        output_path = os.path.join(output_dir, f"{bateria_id}_degradation.png")
        plt.savefig(output_path, dpi=150)
        plt.close() 
        
        print(f"  ✓ Gráfico salvo: {output_path}")

    except Exception as e:
        print(f"  ! Erro ao processar {file_path}: {e}")

print("\nProcessamento concluído. Verifique a pasta 'graficos_degradacao'.")
