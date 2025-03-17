# 基础阶段 - 配置共享设置
FROM node:lts-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 安装阶段 - 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# 构建阶段 - 构建应用
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run prisma:generate
RUN pnpm run build

# 生产依赖阶段 - 安装生产依赖
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
# 生成Prisma客户端
RUN pnpm run prisma:generate
# 删除开发依赖
RUN pnpm prune --prod

# 运行阶段 - 创建最终生产镜像
FROM base AS runner
WORKDIR /app

# 复制生产依赖
COPY --from=prod-deps /app/node_modules ./node_modules

# 复制构建产物
COPY --from=build /app/dist ./dist

# 复制其他文件
COPY package.json ./
COPY prisma ./prisma
COPY .env .env.production ./

# 创建日志目录并设置权限
RUN mkdir -p logs && chown -R node:node /app

# 设置运行用户
USER node

# 暴露应用端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/src/main"]
