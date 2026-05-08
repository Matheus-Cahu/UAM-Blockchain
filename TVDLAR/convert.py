import scipy.io as sio
import pandas as pd
import glob
import os

# 1. Configuração das pastas de entrada
folders = ['1', '2', '3', '4', '5', '6']

for folder in folders:
    # Busca todos os arquivos .mat dentro da pasta atual
    files = glob.glob(os.path.join(folder, "*.mat"))
    
    for file_path in files:
        try:
            print(f"Lendo: {file_path}")
            
            # Carrega o arquivo .mat
            data = sio.loadmat(file_path)
            
            # Localiza a chave principal (ex: 'B0005')
            main_key = [k for k in data.keys() if not k.startswith('__')][0]
            cycles = data[main_key][0, 0]['cycle'][0]

            all_data = []

            # 2. Itera sobre cada ciclo
            for i, cycle in enumerate(cycles):
                c_type = cycle['type'][0]
                
                # Alguns arquivos podem ter estruturas ligeiramente diferentes
                try:
                    ambient_temp = cycle['ambient_temperature'][0][0]
                except:
                    ambient_temp = np.nan

                # Filtramos apenas ciclos de 'discharge' conforme sua necessidade
                if c_type == 'discharge':
                    measurements = cycle['data'][0, 0]
                    
                    # Extração segura de campos obrigatórios
                    if 'Time' in measurements.dtype.names:
                        time_vec = measurements['Time'][0]
                        v_measured = measurements['Voltage_measured'][0]
                        i_measured = measurements['Current_measured'][0]
                        t_measured = measurements['Temperature_measured'][0]
                        
                        # Capacidade (valor único por ciclo de descarga)
                        capacity = measurements['Capacity'][0][0] if 'Capacity' in measurements.dtype.names else None

                        # Monta as linhas temporais
                        for j in range(len(time_vec)):
                            all_data.append({
                                'cycle_id': i + 1,
                                'ambient_temp': ambient_temp,
                                'time_sec': time_vec[j],
                                'voltage_v': v_measured[j],
                                'current_a': i_measured[j],
                                'temp_c': t_measured[j],
                                'capacity_ah': capacity
                            })

            if all_data:
                # 3. Cria o DataFrame e salva com o mesmo nome do original
                df = pd.DataFrame(all_data)
                output_csv_path = file_path.replace('.mat', '_discharge.csv')
                df.to_csv(output_csv_path, index=False)
                print(f"  -> Exportado: {output_csv_path} ({len(df)} linhas)")
            else:
                print(f"  -> Aviso: Nenhum dado de descarga encontrado em {file_path}")

        except Exception as e:
            print(f"  -> Erro ao processar {file_path}: {e}")

print("\nConversão em lote concluída.")
