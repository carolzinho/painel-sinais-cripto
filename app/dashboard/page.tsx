"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  BellRing,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Zap,
  LineChart,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// dados mock da alpaca
async function fetchMarketSentiment(coin: string) {
  const sentiments = ["positive", "neutral", "negative"]
  const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
  return {
    coin,
    sentiment: randomSentiment,
    data: [
      { name: "Positive", value: Math.random() * 100 + 50 },
      { name: "Neutral", value: Math.random() * 50 + 20 },
      { name: "Negative", value: Math.random() * 100 + 10 },
    ],
  }
}

interface NewsItem {
  title: string
  source: string
  date: string
  url: string
  symbols: string[] // array de symbols
}

async function fetchCryptoNews(symbol?: string): Promise<NewsItem[]> {
  const response = await fetch(`/api/alpaca?type=news&symbol=${symbol || ""}`)
  if (!response.ok) {
    console.error("Failed to fetch news from API route")
    return []
  }
  const data = await response.json()
  return data.news || []
}

// dado mock pra coin selecionada
const mockMarketOverview = {
  totalMarketCap: "2.5T",
  volume24h: "150B",
  btcDominance: "52.3%",
}

const mockCoinDetails: Record<string, { price: string; change24h: string; marketCap: string }> = {
  "BTC/USDT": { price: "$68,500.23", change24h: "+2.5%", marketCap: "$1.35T" },
  "ETH/USDT": { price: "$3,820.15", change24h: "+1.8%", marketCap: "$458B" },
  "SOL/USDT": { price: "$155.78", change24h: "-0.7%", marketCap: "$68B" },
  "XRP/USDT": { price: "$0.5234", change24h: "+0.1%", marketCap: "$28B" },
  "ADA/USDT": { price: "$0.4210", change24h: "-1.2%", marketCap: "$15B" },
}

interface Alert {
  id: string
  coin: string
  criteria: string
  active: boolean
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [selectedCoin, setSelectedCoin] = useState("BTC/USDT")
  const [sentimentData, setSentimentData] = useState<any>(null)
  const [news, setNews] = useState<NewsItem[]>([]) // Use NewsItem type
  const [volumeFilter, setVolumeFilter] = useState<number | string>("")
  const [volatilityFilter, setVolatilityFilter] = useState<number | string>("")
  const [trendFilter, setTrendFilter] = useState<"up" | "down" | "">("")
  const [rsiFilter, setRsiFilter] = useState(false)
  const [macdFilter, setMacdFilter] = useState(false)
  const [vwapFilter, setVwapFilter] = useState(false)
  const [maCrossoverFilter, setMaCrossoverFilter] = useState(false)
  const [bollingerBandFilter, setBollingerBandFilter] = useState(false)
  const [stochasticFilter, setStochasticFilter] = useState(false)
  const [marketCapFilter, setMarketCapFilter] = useState<number | string>("")
  const [change24hFilter, setChange24hFilter] = useState<number | string>("")
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([])

  const cryptoOptions = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT"]

  useEffect(() => {
    const loadData = async () => {
      const sentiment = await fetchMarketSentiment(selectedCoin)
      setSentimentData(sentiment)
      const cryptoNews = await fetchCryptoNews(selectedCoin)
      setNews(cryptoNews)
    }
    loadData()
  }, [selectedCoin])

  const checkAlerts = useCallback(() => {
    const newAlerts: Alert[] = []
    const currentCoinDetails = mockCoinDetails[selectedCoin]

    // dados mock pra filtro de lógica
    if (volumeFilter && Number(volumeFilter) > 50000 && selectedCoin === "BTC/USDT") {
      newAlerts.push({ id: "btc-volume", coin: "BTC/USDT", criteria: "Volume Alto", active: true })
    }
    if (trendFilter === "up" && selectedCoin === "ETH/USDT") {
      newAlerts.push({ id: "eth-trend", coin: "ETH/USDT", criteria: "Tendência de Alta", active: true })
    }
    if (rsiFilter && selectedCoin === "SOL/USDT") {
      newAlerts.push({ id: "sol-rsi", coin: "SOL/USDT", criteria: "Sinal RSI", active: true })
    }
    if (maCrossoverFilter && selectedCoin === "XRP/USDT") {
      newAlerts.push({ id: "xrp-ma", coin: "XRP/USDT", criteria: "Crossover de MA", active: true })
    }
    if (bollingerBandFilter && selectedCoin === "ADA/USDT") {
      newAlerts.push({ id: "ada-bb", coin: "ADA/USDT", criteria: "Preço tocando BB", active: true })
    }
    if (stochasticFilter && selectedCoin === "BTC/USDT") {
      newAlerts.push({ id: "btc-stoch", coin: "BTC/USDT", criteria: "Estocástico Sobrecomprado", active: true })
    }
    if (marketCapFilter && Number(marketCapFilter) < 100 && selectedCoin === "SOL/USDT") {
      newAlerts.push({ id: "sol-mcap", coin: "SOL/USDT", criteria: "Capitalização de Mercado Baixa", active: true })
    }
    if (change24hFilter && Number(change24hFilter) > 2 && currentCoinDetails?.change24h.includes("+")) {
      newAlerts.push({
        id: `${selectedCoin}-change`,
        coin: selectedCoin,
        criteria: `Variação 24h > ${change24hFilter}%`,
        active: true,
      })
    }

    const newActiveAlerts = newAlerts.filter((alert) => !activeAlerts.some((a) => a.id === alert.id && a.active))

    if (newActiveAlerts.length > 0) {
      newActiveAlerts.forEach((alert) => {
        toast({
          title: "Alerta de Cripto!",
          description: `${alert.coin} atende ao critério: ${alert.criteria}`,
          action: <BellRing className="h-5 w-5 text-primary" />,
        })
 
      })
    }
    setActiveAlerts(newAlerts)
  }, [
    selectedCoin,
    volumeFilter,
    trendFilter,
    rsiFilter,
    maCrossoverFilter,
    bollingerBandFilter,
    stochasticFilter,
    marketCapFilter,
    change24hFilter,
    activeAlerts,
    toast,
  ])

  useEffect(() => {
    const interval = setInterval(checkAlerts, 5000) // Checa alertas a cada 5 seg
    return () => clearInterval(interval)
  }, [checkAlerts])

  const isAlertActive = (coin: string) => activeAlerts.some((alert) => alert.coin === coin && alert.active)
  const currentCoinDetails = mockCoinDetails[selectedCoin]

  return (
    <div className="min-h-screen bg-background text-foreground p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Header */}
      <div className="lg:col-span-4 flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-primary mb-4 md:mb-0">Dashboard de Sinais</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-secondary text-primary border-border hover:bg-secondary/80 hover:text-primary/90 rounded-xl transition-all duration-300"
            >
              {selectedCoin} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card border-border rounded-xl shadow-lg">
            {cryptoOptions.map((coin) => (
              <DropdownMenuItem
                key={coin}
                onClick={() => setSelectedCoin(coin)}
                className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors duration-200"
              >
                {coin}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* sumário do mercado */}
      <Card className="lg:col-span-4 bg-card border-border shadow-soft rounded-3xl hover:scale-[1.005] transition-transform duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <LineChart className="h-6 w-6" /> Visão Geral do Mercado
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-muted-foreground text-sm">Capitalização Total</p>
            <p className="text-2xl font-bold text-foreground">{mockMarketOverview.totalMarketCap}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Volume 24h</p>
            <p className="text-2xl font-bold text-foreground">{mockMarketOverview.volume24h}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Dominância BTC</p>
            <p className="text-2xl font-bold text-foreground">{mockMarketOverview.btcDominance}</p>
          </div>
        </CardContent>
      </Card>

      {/* sumário moeda */}
      <Card className="lg:col-span-2 bg-card border-border shadow-soft rounded-3xl hover:scale-[1.005] transition-transform duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <DollarSign className="h-6 w-6" /> {selectedCoin} Visão Geral
            {isAlertActive(selectedCoin) && <AlertCircle className="inline-block ml-2 text-destructive" size={20} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-muted-foreground text-sm">Preço Atual</p>
            <p className="text-2xl font-bold text-foreground">{currentCoinDetails?.price}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Variação 24h</p>
            <p
              className={`text-2xl font-bold ${currentCoinDetails?.change24h.includes("+") ? "text-primary" : "text-destructive"}`}
            >
              {currentCoinDetails?.change24h}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Capitalização de Mercado</p>
            <p className="text-2xl font-bold text-foreground">{currentCoinDetails?.marketCap}</p>
          </div>
        </CardContent>
      </Card>

      {/* sentimento de mercado */}
      <Card className="lg:col-span-2 bg-card border-border shadow-soft rounded-3xl hover:scale-[1.005] transition-transform duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Activity className="h-6 w-6" /> Sentimento de Mercado: {selectedCoin}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sentimentData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "hsl(var(--primary))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground">Carregando sentimento...</p>
          )}
        </CardContent>
      </Card>

      {/* embed tradingview) */}
      <Card className="lg:col-span-2 bg-card border-border shadow-soft rounded-3xl hover:scale-[1.005] transition-transform duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <LineChart className="h-6 w-6" /> Gráfico de {selectedCoin}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full overflow-hidden rounded-2xl border border-border">
            <iframe
              src={`https://tradingview.com/widgetembed/?symbol=BINANCE%3A${selectedCoin.replace("/", "")}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f4f7f9&studies=RSI%40tv-basicdata%2CMACD%40tv-basicdata%2CVWAP%40tv-basicdata&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=www.tradingview.com&utm_medium=widget_new&utm_campaign=widget`}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              title={`TradingView Chart for ${selectedCoin}`}
            ></iframe>
          </div>
        </CardContent>
      </Card>

      {/* filtros inteligentes */}
      <Card className="lg:col-span-2 bg-card border-border shadow-soft rounded-3xl hover:scale-[1.005] transition-transform duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Zap className="h-6 w-6" /> Filtros Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="volume" className="text-muted-foreground">
              Volume (min)
            </Label>
            <Input
              id="volume"
              type="number"
              placeholder="Ex: 100000"
              value={volumeFilter}
              onChange={(e) => setVolumeFilter(e.target.value)}
              className="bg-input border-border text-foreground focus:ring-ring rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="volatility" className="text-muted-foreground">
              Volatilidade (%)
            </Label>
            <Input
              id="volatility"
              type="number"
              placeholder="Ex: 5"
              value={volatilityFilter}
              onChange={(e) => setVolatilityFilter(e.target.value)}
              className="bg-input border-border text-foreground focus:ring-ring rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="market-cap" className="text-muted-foreground">
              Capitalização de Mercado (B)
            </Label>
            <Input
              id="market-cap"
              type="number"
              placeholder="Ex: 50"
              value={marketCapFilter}
              onChange={(e) => setMarketCapFilter(e.target.value)}
              className="bg-input border-border text-foreground focus:ring-ring rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="change-24h" className="text-muted-foreground">
              Variação 24h (%)
            </Label>
            <Input
              id="change-24h"
              type="number"
              placeholder="Ex: 2"
              value={change24hFilter}
              onChange={(e) => setChange24hFilter(e.target.value)}
              className="bg-input border-border text-foreground focus:ring-ring rounded-xl"
            />
          </div>
          <div className="col-span-full">
            <Label className="text-muted-foreground">Tendência</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={trendFilter === "up" ? "default" : "outline"}
                onClick={() => setTrendFilter(trendFilter === "up" ? "" : "up")}
                className={`flex-1 ${trendFilter === "up" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary border-border hover:bg-secondary/80"}`}
              >
                <TrendingUp className="mr-2 h-4 w-4" /> Em Alta
              </Button>
              <Button
                variant={trendFilter === "down" ? "default" : "outline"}
                onClick={() => setTrendFilter(trendFilter === "down" ? "" : "down")}
                className={`flex-1 ${trendFilter === "down" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-destructive border-border hover:bg-secondary/80"}`}
              >
                <TrendingDown className="mr-2 h-4 w-4" /> Em Queda
              </Button>
            </div>
          </div>
          <div className="col-span-full grid grid-cols-3 gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="rsi-filter"
                checked={rsiFilter}
                onCheckedChange={setRsiFilter}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
              />
              <Label htmlFor="rsi-filter" className="text-muted-foreground">
                RSI
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="macd-filter"
                checked={macdFilter}
                onCheckedChange={setMacdFilter}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
              />
              <Label htmlFor="macd-filter" className="text-muted-foreground">
                MACD
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="vwap-filter"
                checked={vwapFilter}
                onCheckedChange={setVwapFilter}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
              />
              <Label htmlFor="vwap-filter" className="text-muted-foreground">
                VWAP
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ma-crossover-filter"
                checked={maCrossoverFilter}
                onCheckedChange={setMaCrossoverFilter}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
              />
              <Label htmlFor="ma-crossover-filter" className="text-muted-foreground">
                MA Crossover
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="bollinger-band-filter"
                checked={bollingerBandFilter}
                onCheckedChange={setBollingerBandFilter}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
              />
              <Label htmlFor="bollinger-band-filter" className="text-muted-foreground">
                Bollinger Bands
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="stochastic-filter"
                checked={stochasticFilter}
                onCheckedChange={setStochasticFilter}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
              />
              <Label htmlFor="stochastic-filter" className="text-muted-foreground">
                Estocástico
              </Label>
            </div>
          </div>
          <Button
            onClick={checkAlerts}
            className="col-span-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl mt-4 shadow-md"
          >
            Aplicar Filtros e Verificar Alertas
          </Button>
        </CardContent>
      </Card>

      {/* painel de notícias */}
      <Card className="lg:col-span-2 bg-card border-border shadow-soft rounded-3xl hover:scale-[1.005] transition-transform duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <BellRing className="h-6 w-6" /> Últimas Notícias de Cripto
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[400px] overflow-y-auto pr-2">
          {news.length > 0 ? (
            <div className="space-y-4">
              {news.map((item, index) => {
                // checar se as notícias são relevantes a coin selecionada
                const isRelevant = item.symbols.some(
                  (s) => s === selectedCoin.replace("/USDT", "") || s === selectedCoin,
                )
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border transition-colors duration-200 ${
                      isRelevant
                        ? "bg-primary/20 border-primary hover:bg-primary/30"
                        : "bg-secondary border-border hover:bg-secondary/80"
                    }`}
                  >
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.source} - {item.date}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">Carregando notícias...</p>
          )}
        </CardContent>
      </Card>

      {/* painel de alertas ativos */}
      <Card className="lg:col-span-4 bg-card border-border shadow-soft rounded-3xl hover:scale-[1.005] transition-transform duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <AlertCircle className="h-6 w-6" /> Alertas Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-destructive/20 border border-destructive rounded-xl flex items-center gap-3"
                >
                  <BellRing className="h-6 w-6 text-destructive" />
                  <div>
                    <p className="font-semibold text-foreground">{alert.coin}</p>
                    <p className="text-sm text-muted-foreground">{alert.criteria}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum alerta ativo no momento.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
