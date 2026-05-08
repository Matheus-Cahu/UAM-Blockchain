import pandas as pd
import matplotlib.pyplot as plt

def plotar_iterativo_u_sigma(csv_path, iteracoes=5):
    # 1. Carregar os dados
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"Erro ao ler o arquivo: {e}")
        return

    # Trabalhamos com uma cópia para não alterar o CSV original
    df_temp = df.copy()

    for i in range(1, iteracoes + 1):
        # Ordenar para garantir que o gráfico seja legível
        df_plot = df_temp.sort_values(by=['pasta', 'bateria'])
        
        fig, ax1 = plt.subplots(figsize=(14, 7))

        # --- Eixo 1: Sigma² (Barras) ---
        color_sigma = 'skyblue'
        ax1.set_xlabel('ID da Bateria', fontsize=12)
        ax1.set_ylabel('Sigma² (Variância)', color='navy', fontsize=12)
        bars = ax1.bar(df_plot['bateria'], df_plot['sigma2'], color=color_sigma, edgecolor='navy', alpha=0.7, label='Sigma²')
        ax1.tick_params(axis='y', labelcolor='navy')
        ax1.set_xticks(range(len(df_plot['bateria'])))
        ax1.set_xticklabels(df_plot['bateria'], rotation=45, ha='right')

        # --- Eixo 2: Valor u (Linha com pontos) ---
        ax2 = ax1.twinx()  # Cria o segundo eixo
        color_u = 'red'
        ax2.set_ylabel('Valor u (Tendência)', color=color_u, fontsize=12)
        ax2.plot(df_plot['bateria'], df_plot['valor_u'], color=color_u, marker='o', linestyle='--', linewidth=1.5, label='Valor u')
        ax2.tick_params(axis='y', labelcolor=color_u)

        # Título e Ajustes
        plt.title(f'Iteração {i}: Análise TVDLAR', fontsize=14)
        ax1.grid(axis='y', linestyle='--', alpha=0.4)
        fig.tight_layout()

        plt.show()

        # --- Remoção do Outlier para a próxima rodada ---
        if len(df_temp) > 1:
            idx_outlier = df_temp['sigma2'].idxmax()
            outlier_nome = df_temp.loc[idx_outlier, 'bateria']
            outlier_val = df_temp.loc[idx_outlier, 'sigma2']
            print(f"❌ Outlier removido: {outlier_nome} (σ² = {outlier_val:.4f})")
            df_temp = df_temp.drop(idx_outlier)
        else:
            print("Não há mais dados para remover.")
            break

# Executar
plotar_iterativo_u_sigma('resultados_tvdlar_consolidado.csv', iteracoes=23)
