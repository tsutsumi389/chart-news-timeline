# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chart News Timeline is a web application for visualizing stock price candlestick charts integrated with news information. The goal is to visually analyze how news events impact stock prices by displaying news markers on the candlestick chart with tooltip popups.

**Current Status**: Initial planning phase. The frontend technology stack has been decided, but implementation has not yet started.

## Technology Stack

### Frontend (Decided)
- **Framework**: React + TypeScript
- **Chart Library**: Apache ECharts (chosen specifically for its built-in tooltip functionality for news markers)
- **Build Tool**: Vite
- **Development Environment**: Docker + Docker Compose (Node.js 24)

### Backend & Database (Future Implementation)
- Not yet implemented
- Will be added in Phase 2 after frontend completion

## Architecture

### Phased Development Approach

**Phase 1 (Current)**: Frontend-only implementation
- Build candlestick chart visualization
- Use sample data (no backend)
- Focus on design validation

**Phase 2 (Future)**: Backend integration
- Data persistence with database
- CSV/JSON data import functionality
- API layer for frontend-backend communication

**Phase 3 (Future)**: Advanced features
- Real-time updates
- Technical indicators
- Sentiment analysis

### Key Design Decisions

1. **Apache ECharts over alternatives**: Selected because tooltip (popup) functionality is built-in, making it easier to display news information in balloon/popup format on candlestick charts.

2. **Docker development environment**: All development happens in Docker containers using the latest Docker Compose V2 format (`compose.yml`, not `docker-compose.yml`).

3. **Type safety**: TypeScript type definitions for stock data are defined in `types/stock.ts`:
   - `CandlestickData`: date, open, close, low, high
   - Future: `NewsItem` type for news data with sentiment analysis

4. **Color scheme**:
   - Bullish candles (price up): #26A69A (green)
   - Bearish candles (price down): #EF5350 (red)

## Docker Commands

This project uses **Docker Compose V2** (command is `docker compose`, not `docker-compose`).

```bash
# Start containers with watch mode (recommended for development)
docker compose up --watch

# Start containers in background
docker compose up -d

# View logs
docker compose logs -f frontend

# Stop containers
docker compose down

# Run commands inside container
docker compose exec frontend npm install <package-name>

# Rebuild from scratch
docker compose build --no-cache
```

The application runs on `http://localhost:5173` (Vite default port).

### Docker Configuration Details

- **Base image**: `node:24-alpine`
- **Watch mode**: `compose.yml` includes `develop.watch` configuration for automatic file sync and rebuild
- **Volumes**: Source code is mounted; `node_modules` uses separate volume for performance

## Project Structure

```
chart-news-timeline/
├── docs/
│   └── frontend-implementation-plan.md    # Detailed implementation plan
├── frontend/                              # Frontend application (not yet created)
│   ├── src/
│   │   ├── components/
│   │   │   └── StockChart.tsx            # Main chart component
│   │   ├── types/
│   │   │   └── stock.ts                  # TypeScript type definitions
│   │   ├── data/
│   │   │   └── sampleData.ts             # Sample stock data
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── .dockerignore
├── compose.yml                            # Docker Compose configuration
└── README.md
```

## Implementation Plan

See `docs/frontend-implementation-plan.md` for detailed specifications including:
- ECharts configuration examples
- Data type definitions
- Sample data format
- Color schemes
- Step-by-step implementation guide

## Important Notes for Implementation

1. **Vite configuration for Docker**: When creating the Vite project, ensure the dev server is configured with `--host 0.0.0.0` to be accessible from outside the container.

2. **ECharts data format**: Candlestick data must be formatted as `[open, close, low, high]` arrays for ECharts, not as objects.

3. **Future news integration**: When implementing news markers later, use ECharts' `markPoint` feature with custom tooltips. Sentiment-based color coding (positive=green, negative=red, neutral=gray) should be applied.

4. **Japanese language support**: This is a Japanese project - UI text and documentation may be in Japanese.

5. **No backend yet**: Current phase focuses solely on frontend chart visualization with hardcoded sample data.

## Code Style and Conventions

### Comments in Japanese

**All source code comments must be written in Japanese.** This includes:
- Inline comments
- Function/method documentation
- Type definitions comments
- TODO comments
- Any explanatory comments in the code

Example:
```typescript
// ❌ Wrong
// Calculate the average price
const avgPrice = (open + close) / 2;

// ✅ Correct
// 平均価格を計算
const avgPrice = (open + close) / 2;

/**
 * ❌ Wrong
 * StockChart component displays candlestick chart
 * @param data - Stock price data
 */

/**
 * ✅ Correct
 * ローソク足チャートを表示するコンポーネント
 * @param data - 株価データ
 */
```

This applies to all files in the `frontend/src/` directory. Configuration files and documentation in `docs/` may use Japanese or English as appropriate.
