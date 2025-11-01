FROM node:24-alpine

WORKDIR /app

# OpenSSL をインストール(将来のPrisma用)
RUN apk add --no-cache openssl

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションコードをコピー
COPY . .

# ポート公開
EXPOSE 3000

# 開発サーバー起動
CMD ["npm", "run", "dev"]
