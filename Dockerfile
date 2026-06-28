# ============================================================
# Commercial Ad Skill Orchestrator — Dockerfile
# P6: 生产部署容器化
# ============================================================

# ---- Stage 1: 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖定义，利用 Docker 缓存层
COPY package.json ./

# 安装生产依赖（本项目无第三方依赖，纯 Node.js 内置模块）
RUN npm install --production --omit=dev 2>/dev/null || true

# ---- Stage 2: 运行阶段 ----
FROM node:20-alpine AS runtime

# 安全：创建非 root 用户运行服务
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# 仅复制必要文件（遵循最小权限原则）
COPY --chown=appuser:appgroup package.json ./
COPY --chown=appuser:appgroup infrastructure/ ./infrastructure/
COPY --chown=appuser:appgroup skills/ ./skills/
COPY --chown=appuser:appgroup deploy/ ./deploy/
COPY --chown=appuser:appgroup systems/ ./systems/
COPY --chown=appuser:appgroup scripts/ ./scripts/
COPY --chown=appuser:appgroup core/ ./core/
COPY --chown=appuser:appgroup utils/ ./utils/
COPY --chown=appuser:appgroup config/ ./config/

# 健康检查脚本权限
RUN chmod +x deploy/healthcheck.js

# 创建日志和临时输出目录
RUN mkdir -p /app/logs /app/tmp-output && \
    chown -R appuser:appgroup /app/logs /app/tmp-output

# 切换到非 root 用户
USER appuser

# 暴露服务端口（EventBus HTTP 健康检查/指标端点）
EXPOSE 3000

# 健康检查：每 30s 检查一次，超时 5s，失败 3 次后标记 unhealthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node deploy/healthcheck.js || exit 1

# 环境变量默认值（可被 docker-compose 或运行时覆盖）
ENV NODE_ENV=production \
    LOG_LEVEL=info \
    EVENT_BUS_PORT=3000 \
    MAX_PIPELINE_CONCURRENCY=3 \
    SKILL_TIMEOUT_MS=30000 \
    ENABLE_COMPENSATION=true \
    ENABLE_METRICS=true

# 启动命令
CMD ["node", "infrastructure/index.js"]
