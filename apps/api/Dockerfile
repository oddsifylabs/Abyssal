FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
COPY packages/config/package*.json ./packages/config/
RUN npm install
COPY . .
RUN npm run build --workspace=@abyssal/types
RUN npm run build --workspace=@abyssal/api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
