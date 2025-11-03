import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import StockChart from './components/StockChart'
import { StockPriceImport } from './pages/StockPriceImport'
import { sampleStockData } from './data/sampleData'
import { sampleNewsData } from './data/sampleNewsData'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
          <h1>Chart News Timeline</h1>
          <nav style={{ marginTop: '10px' }}>
            <Link to="/" style={{ marginRight: '20px' }}>チャート表示</Link>
            <Link to="/import">株価インポート</Link>
          </nav>
        </header>

        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={
              <>
                <p>株価ローソク足チャート with ニュース情報</p>
                <StockChart stockData={sampleStockData} newsData={sampleNewsData} />
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
