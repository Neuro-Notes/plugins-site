# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS dependencies
WORKDIR /workspace
RUN apk add --no-cache git
COPY packages/design-tokens ./packages/design-tokens
WORKDIR /workspace/docs
COPY docs/package.json docs/yarn.lock* ./
RUN corepack prepare yarn@1.22.22 --activate
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install --frozen-lockfile
COPY docs/. ./

FROM dependencies AS build
RUN yarn build

FROM nginx:1.27-alpine AS runtime
COPY docs/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/docs/.vitepress/dist /usr/share/nginx/html/docs
EXPOSE 3001
