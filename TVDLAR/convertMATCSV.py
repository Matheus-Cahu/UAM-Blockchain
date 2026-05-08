import scipy.io
import pandas as pd
import os

def mat_to_csv(file_path):
    # 1. Carrega o arquivo .mat
    try:
        data = scipy.io.loadmat(file_path)
    except Exception as e:
        print(f"Erro ao ler o arquivo: {e}")
        return

    # 2. Filtra metadados automáticos do MATLAB (__header__, __version__, etc.)
    # Mantém apenas as variáveis de dados reais
    variables = {k: v for k, v in data.items() if not k.startswith('__')}

    if not variables:
        print("Nenhuma variável de dados encontrada no arquivo.")
        return

    print(f"Variáveis encontradas: {list(variables.keys())}")

    # 3. Processa cada variável encontrada
    for var_name, value in variables.items():
        try:
            # Converte para DataFrame (funciona bem para matrizes 1D e 2D)
            df = pd.DataFrame(value)
            
            # Gera o nome do arquivo de saída (ex: dado_variavel.csv)
            base_name = os.path.splitext(file_path)[0]
            output_file = f"{base_name}_{var_name}.csv"
            
            # Salva em CSV
            df.to_csv(output_file, index=False)
            print(f"✅ Variável '{var_name}' exportada para: {output_file}")
            
        except Exception as e:
            print(f"⚠️  Não foi possível converter a variável '{var_name}': {e}")
            print("Isso geralmente ocorre se a variável não for uma matriz simples (ex: estruturas complexas).")

# Exemplo de uso
if __name__ == "__main__":
    arquivo_alvo = 'TUM/BW-VTC-151_2119_CU_cal_000_BW-VTC-CAL.mat' # Substitua pelo caminho do seu arquivo
    if os.path.exists(arquivo_alvo):
        mat_to_csv(arquivo_alvo)
    else:
        print(f"Arquivo {arquivo_alvo} não encontrado.")
