FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./

RUN pnpm config set strict-dep-builds false && pnpm install --no-frozen-lockfile

COPY . .

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build


CMD ["pnpm", "start"]
