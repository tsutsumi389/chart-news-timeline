import './App.css'
import StockChart from './components/StockChart'
import { sampleStockData } from './data/sampleData'
import { sampleNewsData } from './data/sampleNewsData'

function App() {
  return (
    <div className="App">
      <h1>Chart News Timeline</h1>
      <p>株価ローソク足チャート with ニュース情報</p>
      <StockChart stockData={sampleStockData} newsData={sampleNewsData} />
    </div>
  )
}

export default App
