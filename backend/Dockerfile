FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Enable pnpm via corepack
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --no-frozen-lockfile
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY swagger-output.json ./

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["pnpm", "start"]
