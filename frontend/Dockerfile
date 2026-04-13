FROM node:22-alpine AS base

# 1. Image để cài đặt dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
# Dùng legacy-peer-deps nếu có xung đột hoặc đơn giản là npm install
RUN npm ci || npm install --legacy-peer-deps

# 2. Image để build ứng dụng
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Chuyển API URL sang backend production hoặc dùng alias nội bộ docker khi build 
# ENV NEXT_PUBLIC_API_URL=...
RUN npm run build

# 3. Image để chạy production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy các thư mục cần thiết từ builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
