FROM node:18-alpine

WORKDIR /usr/src/app

# Copia os arquivos de definição de pacotes
COPY package*.json ./

# Instala as dependências (incluindo o 'pg')
RUN npm install

# Copia o restante do código (server.js, etc)
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
