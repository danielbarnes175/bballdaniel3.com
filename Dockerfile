FROM dhi.io/node:25-alpine3.22-dev AS build-stage
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

FROM dhi.io/node:25-alpine3.22 AS runtime-stage
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build-stage /app/node_modules ./node_modules
COPY app ./app
COPY package*.json ./

EXPOSE 1234
CMD ["node", "app/server.js"]
