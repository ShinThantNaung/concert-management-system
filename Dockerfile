FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev --omit=optional \
    && npm cache clean --force
RUN mkdir -p /app/logs
RUN mkdir -p /app/logs && chmod 777 /app/logs

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000
USER node
CMD ["npx", "tsx", "src/index.ts"]
