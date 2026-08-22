# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS dependencies
WORKDIR /workspace
RUN apk add --no-cache python3 make g++
COPY packages/design-tokens ./packages/design-tokens
WORKDIR /workspace/app
COPY app/package.json app/yarn.lock* ./
RUN corepack prepare yarn@1.22.22 --activate
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install --frozen-lockfile
COPY app/. ./
RUN yarn postinstall

FROM dependencies AS build
RUN yarn build

FROM node:24-alpine AS runtime
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /workspace/app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
