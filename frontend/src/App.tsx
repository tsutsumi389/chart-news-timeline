import './App.css'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import StockChart from './components/StockChart'
import { StockPriceImport } from './pages/StockPriceImport'
import { sampleStockData } from './data/sampleData'
import { sampleNewsData } from './data/sampleNewsData'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        {/* ヘッダー */}
        <header className="App-header">
          <div className="App-header-content">
            <div className="App-header-top">
              <div className="App-logo-section">
                <div className="App-logo">📈</div>
                <div>
                  <h1 className="App-title">Chart News Timeline</h1>
                  <p className="App-subtitle">株価チャート × ニュース可視化プラットフォーム</p>
                </div>
              </div>
            </div>

            {/* ナビゲーション */}
            <nav className="App-nav">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "App-nav-link active" : "App-nav-link"
                }
              >
                <span className="App-nav-link-icon">📊</span>
                チャート表示
              </NavLink>
              <NavLink
                to="/import"
                className={({ isActive }) =>
                  isActive ? "App-nav-link active" : "App-nav-link"
                }
              >
                <span className="App-nav-link-icon">📤</span>
                株価インポート
              </NavLink>
            </nav>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="App-main">
          <Routes>
            <Route path="/" element={
              <>
                <div className="App-page-header">
                  <h2 className="App-page-title">株価ローソク足チャート</h2>
                  <p className="App-page-description">
                    株価の値動きとニュース情報を統合したインタラクティブなチャートです。
                    ローソク足にマウスを合わせると詳細情報が表示されます。
                  </p>
                </div>
                <div className="App-card">
                  <StockChart stockData={sampleStockData} newsData={sampleNewsData} />
                </div>
              </>
            } />
            <Route path="/import" element={<StockPriceImport />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
