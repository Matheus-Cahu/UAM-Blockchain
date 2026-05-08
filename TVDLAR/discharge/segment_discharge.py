import pandas as pd
import os

# 1. Configurações de caminhos
file_path = 'discharge.csv'  # O seu arquivo consolidado
output_dir = 'baterias_segmentadas'

# Cria o diretório de saída se ele não existir
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

try:
    print(f"Lendo o arquivo {file_path}...")
    # 2. Carrega o dataset completo
    df = pd.read_csv(file_path)

    # Verifica se a coluna 'Battery' existe no arquivo
    if 'Battery' in df.columns:
        # 3. Obtém a lista de baterias únicas
        lista_baterias = df['Battery'].unique()
        print(f"Baterias encontradas: {lista_baterias}")

        # 4. Itera e segmenta
        for bateria in lista_baterias:
            # Filtra os dados apenas para a bateria atual
            df_especifico = df[df['Battery'] == bateria]
            
            # Define o nome do arquivo de saída (ex: B0005_data.csv)
            file_name = f"{bateria}_data.csv"
            save_path = os.path.join(output_dir, file_name)
            
            # Salva o CSV segmentado
            df_especifico.to_csv(save_path, index=False)
            print(f"  ✓ Arquivo criado para {bateria}: {save_path}")
            
        print("\nProcessamento concluído com sucesso!")
    else:
        print("Erro: A coluna 'Battery' não foi encontrada no arquivo CSV.")
        print(f"Colunas disponíveis: {list(df.columns)}")

except FileNotFoundError:
    print(f"Erro: O arquivo '{file_path}' não foi encontrado.")
except Exception as e:
    print(f"Ocorreu um erro inesperado: {e}")
