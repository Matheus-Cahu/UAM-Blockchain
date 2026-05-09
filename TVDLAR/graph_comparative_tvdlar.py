import pandas as pd
import glob
import os
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import savgol_filter
from sklearn.metrics import mean_squared_error

# --- CONFIGURAÇÕES ---
folders = ['1', '2', '3', '4', '5', '6']
resultados_finais = []
output_dir = "tvdlar_com_smoothing"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

plt.style.use('seaborn-v0_8-whitegrid')

print("Iniciando processamento: Filtro > 100 ciclos -> Threshold -> Smoothing -> TVDLAR -> Métricas...")

rmse_list = []
loss_list = []

for folder in folders:
    files = glob.glob(os.path.join(folder, "*_discharge.csv"))
    
    for file_path in files:
        try:
            # 1. CARGA E LIMPEZA DE DADOS (THRESHOLD)
            df = pd.read_csv(file_path, usecols=['cycle_id', 'capacity_ah'])
            serie_raw = df.groupby('cycle_id')['capacity_ah'].first().dropna()
            
            # --- FILTRO: APENAS DATASETS COM MAIS DE 100 ENTRADAS ---
            if len(serie_raw) <= 100:
                continue

            # Remoção de ruído extremo (pontos abaixo de 50% da média)
            media_total = serie_raw.mean()
            serie_clean = serie_raw[serie_raw >= (0.5 * media_total)]
            
            y_real = serie_clean.values
            indices = serie_clean.index
            
            # 2. DATA SMOOTHING (Savitzky-Golay)
            # Mantendo a lógica de janela agressiva baseada na imagem de referência [image_748e39.png]
            window = len(y_real) if (len(y_real) % 2 == 1) else len(y_real) - 1
            serieY_suave = savgol_filter(y_real, window_length=window, polyorder=2)
            
            # Normalização para State of Health (SoH %)
            v_ref = serieY_suave[0]
            serieSoH = 100 * serieY_suave / v_ref
            serieSoH_real = 100 * y_real / v_ref # Dados reais na mesma escala

            # 3. CÁLCULO DAS RAZÕES (C) SOBRE A SÉRIE SUAVIZADA
            serieSoHMetade = serieSoH[:len(serieSoH)//2]
            serieC_suave = serieSoHMetade[1:] / serieSoHMetade[:-1]

            # 4. ESTIMATIVA DE u (TVDLAR)
            numU = np.sum(serieC_suave[1:] * serieC_suave[:-1])
            denU = np.sum(serieC_suave[:-1]**2)

            if denU != 0:
                u_result = numU / denU

            # 5. RECONSTRUÇÃO DA CURVA MODELADA
            num_ciclos = len(serieSoH)
            curva_modelada_Y = np.zeros(num_ciclos) 
            curva_modelada_Y[0] = serieSoH[0]
            
            c_estimado = serieC_suave[0]
            for i in range(1, num_ciclos):
                curva_modelada_Y[i] = curva_modelada_Y[i-1] * c_estimado
                c_estimado = u_result * c_estimado

            # --- 6. CÁLCULO DE MÉTRICAS (MSE E LOSS) ---
            # MSE entre a tendência modelada e os dados reais em escala SoH
            mse_val = mean_squared_error(serieSoH_real, curva_modelada_Y)
            # Loss interpretada como a raiz do erro (RMSE) ou erro absoluto médio
            rmse_val = np.sqrt(mse_val)
            loss_val = np.mean(np.abs(serieSoH_real - curva_modelada_Y))

            # 7. GERAÇÃO DO GRÁFICO
            bateria_id = os.path.basename(file_path).replace('_discharge.csv', '')
            fig, ax = plt.subplots(figsize=(12, 6))
            ponto_corte = len(indices) // 2
            ciclo_corte = indices[ponto_corte]

# Desenha a linha vertical
            ax.axvline(x=ciclo_corte, color='red', linestyle='--', linewidth=1.5, alpha=0.7, 
           label=f'Início da Predição (Ciclo {ciclo_corte})')

# Atualize a legenda para que o novo rótulo apareça
            ax.legend(frameon=True, loc='upper right')
            ax.scatter(indices, serieSoH_real, color='gray', s=10, alpha=0.4, label='Dados Reais (SoH %)')
            ax.plot(indices, serieSoH, color='#1f77b4', linewidth=1.5, label='Série Suavizada (Input)')
            ax.plot(indices, curva_modelada_Y, color='#ff7f0e', linestyle='--', linewidth=2.5, 
                    label=f'TVDLAR (u={u_result:.8f})')
            
            ax.set_title(f"Modelagem TVDLAR: {bateria_id} | RMSE: {rmse_val:.4f}")
            ax.set_xlabel("Ciclo")
            ax.set_ylabel("State of Health (%)")
            ax.set_ylim(40, 110)
            ax.legend(frameon=True)
            
            plt.savefig(os.path.join(output_dir, f"{bateria_id}_tvdlar_final.png"), dpi=150)
            plt.close(fig)

            resultados_finais.append({
                'bateria': bateria_id,
                'u': u_result,
                'ciclos': num_ciclos,
                'rmse': rmse_val,
                'loss_mae': loss_val
            })
            print(f" ✓ {bateria_id}: u={u_result:.8f} | RMSE={rmse_val:.4f} |Loss={loss_val:.4f}")
            rmse_list.append(rmse_val)
            loss_list.append(loss_val)

        except Exception as e:
            print(f" ! Erro em {file_path}: {e}")

if resultados_finais:
    avg_rmse = sum(rmse_list)/len(rmse_list)
    avg_loss = sum(loss_list)/len(loss_list)
    print(f"Average RMSE: {avg_rmse}")
    print(f"Average Loss: {avg_loss}")
    pd.DataFrame(resultados_finais).to_csv('relatorio_tvdlar_completo.csv', index=False)
    print(f"\nFinalizado! Registros processados: {len(resultados_finais)}")
