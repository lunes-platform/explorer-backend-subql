FROM node:20-alpine

WORKDIR /app

RUN npm install -g tsx

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npx prisma generate

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push && tsx server.js"]
