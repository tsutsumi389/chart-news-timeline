FROM node:24-alpine

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションコードをコピー
COPY . .

# Viteの開発サーバーを起動
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
