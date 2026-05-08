import pandas as pd
import glob
import os

folders = ['1', '2', '3', '4', '5', '6']
resultados_finais = []

print("Iniciando cálculo do parâmetro u e sigma² (TVDLAR) em lote...")

for folder in folders:
    files = glob.glob(os.path.join(folder, "*_discharge.csv"))
    
    for file_path in files:
        try:
            df = pd.read_csv(file_path)
            
            serieY = df.groupby('cycle_id')['capacity_ah'].first().dropna().tolist()
            
            if len(serieY) < 3:
                print(f"  ! {file_path}: Dados insuficientes para TVDLAR.")
                continue

            serieC = []
            for i in range(1, len(serieY)):
                serieC.append(serieY[i] / serieY[i-1])

            numU = 0
            denU = 0
            for i in range(1, len(serieC)):
                numU += serieC[i] * serieC[i-1]
                denU += serieC[i-1] * serieC[i-1]

            if denU != 0:
                u_result = numU / denU
                
                soma_residuos = 0
                for i in range(1, len(serieC)):
                    soma_residuos += (serieC[i] - (u_result * serieC[i-1]))**2
                
                sigma2_result = soma_residuos / (len(serieC) - 1)

                nome_arquivo = os.path.basename(file_path)
                resultados_finais.append({
                    'pasta': folder,
                    'arquivo': nome_arquivo,
                    'bateria': nome_arquivo.replace('_discharge.csv', ''),
                    'valor_u': u_result,
                    'sigma2': sigma2_result,
                    'num_ciclos': len(serieY)
                })
                print(f"  ✓ {nome_arquivo}: u = {u_result:.6f} | s² = {sigma2_result:.8f}")
            else:
                print(f"  ! {file_path}: Erro de divisão por zero (denU).")

        except Exception as e:
            print(f"  ! Erro ao processar {file_path}: {e}")

if resultados_finais:
    df_resumos = pd.DataFrame(resultados_finais)
    df_resumos.to_csv('resultados_tvdlar_consolidado.csv', index=False)
    print(f"\nProcessamento concluído! Resultados salvos em 'resultados_tvdlar_consolidado.csv'.")
    print(df_resumos.head())
else:
    print("\nNenhum resultado foi gerado.")
