# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chart News Timeline is a full-stack web application for visualizing stock price candlestick charts integrated with news information. The goal is to visually analyze how news events impact stock prices by displaying news markers on the candlestick chart with tooltip popups.

**Current Status**: Backend and frontend infrastructure is implemented. Prisma ORM is configured with PostgreSQL. Sample data visualization is working on frontend.

## Technology Stack

### Frontend
- **Framework**: React + TypeScript
- **Chart Library**: Apache ECharts (chosen specifically for its built-in tooltip functionality for news markers)
- **Build Tool**: Vite
- **Development Environment**: Docker + Docker Compose (Node.js 24 Alpine)

### Backend
- **Runtime**: Node.js 24 (Alpine)
- **Language**: TypeScript
- **Framework**: Fastify
- **ORM**: Prisma Client
- **Validation**: Zod
- **Testing**: Vitest
- **Development Environment**: Docker + Docker Compose

### Database
- **RDBMS**: PostgreSQL 16 (Alpine)
- **Schema Management**: Prisma
- **Models**: Stock (株マスタ), StockPrice (株価OHLC), News (ニュース)

## Architecture

### Service Architecture

The application uses Docker Compose with three services:

```
frontend (React+Vite) :5173
    ↓
backend (Fastify) :3000
    ↓
db (PostgreSQL) :5432
```

### Database Schema

Managed via Prisma ORM at [backend/prisma/schema.prisma](backend/prisma/schema.prisma):

- **Stock**: 株マスタテーブル (stockCode, stockName)
- **StockPrice**: 株価テーブル (tradeDate, OHLC data, volume)
- **News**: ニューステーブル (publishedAt, title, sentiment, etc.)
- **Sentiment**: ENUM型 (positive, negative, neutral)

Key relationships:
- Stock 1:N StockPrice
- Stock 1:N News

### Frontend Structure

- **Types**: [frontend/src/types/stock.ts](frontend/src/types/stock.ts) defines CandlestickData, NewsItem, SentimentConfig
- **Chart Component**: [frontend/src/components/StockChart.tsx](frontend/src/components/StockChart.tsx) renders ECharts
- **Chart Config**: [frontend/src/utils/chartOptions.ts](frontend/src/utils/chartOptions.ts) contains ECharts configuration
- **Sample Data**: `frontend/src/data/` contains sample stock and news data

### Backend Structure

- **Entry Point**: [src/index.ts](backend/src/index.ts) → [src/server.ts](backend/src/server.ts) (Fastify server initialization)
- **Database**: [src/config/database.ts](backend/src/config/database.ts) (Prisma client singleton, connection management)
- **Types**: `src/types/api.ts`, `src/types/responses.ts` (API request/response types)
- **Utilities**: `src/utils/errorHandler.ts`, `src/utils/logger.ts`
- **Testing**: Unit tests with `.test.ts` suffix using Vitest

### Key Design Decisions

1. **Apache ECharts over alternatives**: Selected because tooltip (popup) functionality is built-in, making it easier to display news information in balloon/popup format on candlestick charts.

2. **Docker development environment**: All development happens in Docker containers using the latest Docker Compose V2 format (`compose.yml`, not `docker-compose.yml`).

3. **Color scheme**:
   - Bullish candles (price up): #26A69A (green)
   - Bearish candles (price down): #EF5350 (red)
   - News sentiment: positive=green, negative=red, neutral=gray

## Development Commands

### Docker Commands (Primary Development Method)

This project uses **Docker Compose V2** (command: `docker compose`, not `docker-compose`).

```bash
# Start all services with watch mode (recommended)
docker compose up --watch

# Start in background
docker compose up -d

# View logs
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db

# Stop services
docker compose down

# Stop and remove volumes (complete reset)
docker compose down -v

# Rebuild from scratch
docker compose build --no-cache

# Execute commands in containers
docker compose exec backend sh
docker compose exec frontend sh

# Database access
docker compose exec db psql -U chartuser -d chartdb
```

### Frontend Commands (inside container)

```bash
# Development server (running via Docker)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

### Backend Commands (inside container)

```bash
# Development server with watch mode
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Watch mode tests
npm run test:watch

# Coverage report
npm run test:coverage

# Prisma commands
npm run db:seed                    # Seed database with sample data
npx prisma migrate dev             # Create and apply migration
npx prisma migrate dev --name <name>  # Create named migration
npx prisma studio                  # Open Prisma Studio GUI
npx prisma generate                # Generate Prisma Client
```

### Access URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432 (chartuser/chartpass/chartdb)

## Key Technical Details

### Database Connection

- **Environment Variable**: `DATABASE_URL=postgresql://chartuser:chartpass@db:5432/chartdb`
- **Singleton Pattern**: Prisma client is accessed via `getPrismaClient()` in [src/config/database.ts](backend/src/config/database.ts)
- **Health Check**: PostgreSQL has health check configured; backend waits for DB readiness

### ECharts Configuration

- **Data Format**: Candlestick data must be `[open, close, low, high]` arrays for ECharts (not objects)
- **Color Scheme**:
  - Bullish (価格上昇): #26A69A (green)
  - Bearish (価格下降): #EF5350 (red)
- **News Markers**: Use ECharts `markPoint` feature with sentiment-based colors

### Vite Configuration

Dev server is configured with `--host 0.0.0.0` in Dockerfile to be accessible from outside the container.

### Environment Variables

Frontend:
- `NODE_ENV=development`
- `VITE_API_URL=http://localhost:3000`

Backend:
- `NODE_ENV=development`
- `DATABASE_URL=postgresql://chartuser:chartpass@db:5432/chartdb`
- `PORT=3000`

## Code Style Conventions

### Comments in Japanese

**All source code comments must be written in Japanese**, including:
- Inline comments
- Function/method documentation
- Type definitions comments
- TODO comments

```typescript
// ✅ Correct
// 平均価格を計算
const avgPrice = (open + close) / 2;

// ❌ Wrong
// Calculate the average price
const avgPrice = (open + close) / 2;
```

### Testing

- Unit tests use Vitest with `.test.ts` suffix
- Backend tests are located alongside source files (e.g., `database.test.ts` next to `database.ts`)
- Run tests with `npm test` or `npm run test:watch` (in backend container)

## Important Notes

- This is a Japanese language project - UI text and documentation may be in Japanese
- Always use Docker Compose for development (don't run Node.js directly on host)
- Prisma schema changes require migration: `npx prisma migrate dev`
- After schema changes, regenerate Prisma Client: `npx prisma generate`
- Watch mode in Docker Compose auto-syncs `src/` changes and rebuilds on `package.json` changes
