serieY = []
limite = 15

for i in range(0,limite):
     serieY.append(100*0.9**i)    

#print(serieY)
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

print("Limite: ", limite)
print("U: ", u_result)
sum = 0            

for i in range(1, len(serieC)):
    sum += (serieC[i]-(u_result*serieC[i-1]))**2

sigma2 = sum/(len(serieC)-1)
print("Sigma²: ", sigma2)
