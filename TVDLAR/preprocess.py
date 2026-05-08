import pandas as pd
import glob
import os

# 1. Configuração de caminhos
input_dir = '3/'
output_dir = '3_preprocessed/'

# Cria a pasta de saída se não existir
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 2. Busca todos os arquivos .csv na pasta 3/
files = glob.glob(os.path.join(input_dir, "*.csv"))

print(f"Iniciando pré-processamento de {len(files)} arquivos...")

for file_path in files:
    try:
        # Pega o nome do arquivo para manter a referência da bateria
        file_name = os.path.basename(file_path)
        
        # 3. Carrega o dataset
        df = pd.read_csv(file_path)
        
        # Verifica se as colunas necessárias existem
        required_cols = ['cycle_id', 'capacity_ah']
        if not set(required_cols).issubset(df.columns):
            print(f"  ! Colunas ausentes em {file_name}. Pulando...")
            continue
            
        # 4. Segmentação: Apenas uma linha por ciclo
        # Selecionamos as colunas e removemos duplicatas de cycle_id
        # O 'first' garante que pegamos o valor de capacidade registrado para aquele ciclo
        df_minimal = df[required_cols].drop_duplicates(subset=['cycle_id'], keep='first')
        
        # 5. Ordenação e limpeza final
        df_minimal = df_minimal.sort_values(by='cycle_id').dropna()
        
        # 6. Salvamento
        output_path = os.path.join(output_dir, f"preprocessed_{file_name}")
        df_minimal.to_csv(output_path, index=False)
        
        print(f"  ✓ {file_name} -> {len(df_minimal)} ciclos processados.")

    except Exception as e:
        print(f"  ! Erro ao processar {file_path}: {e}")

print(f"\nConcluído! Os arquivos prontos para o TVDLAR estão em: {output_dir}")
