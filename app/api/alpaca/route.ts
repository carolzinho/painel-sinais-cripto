import { NextResponse } from "next/server"

const ALPACA_API_KEY = process.env.ALPACA_API_KEY
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY
const ALPACA_BASE_URL = "https://data.paper-api.alpaca.markets" 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const symbol = searchParams.get("symbol")

  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    return NextResponse.json({ error: "API não configuradas." }, { status: 500 })
  }

  const headers = {
    "APCA-API-KEY-ID": ALPACA_API_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
  }

  try {
    let url: string
    let response: Response
    let rawResponseText: string
    let data: any

    if (type === "news") {
      url = `${ALPACA_BASE_URL}/v1beta1/news?sort=desc&limit=10`
      if (symbol) {
        url += `&symbols=${symbol.replace("/USDT", "")}`
      }
      response = await fetch(url, { headers })

      if (!response.ok) {
        const errorText = await response.text() 
        console.error(`Erro na API alpaca (${response.status}):`, errorText)
        throw new Error(`Falha em requisição de dados a api: ${response.status} - ${errorText}`)
      }

      rawResponseText = await response.text() 
      try {
        data = JSON.parse(rawResponseText) 
      } catch (jsonError: any) {
        console.error("Falha em fazer parse JSON:", rawResponseText)
        throw new Error(`API retornou JSON mal formatada: ${rawResponseText.substring(0, 200)}...`)
      }

      if (!data || !Array.isArray(data.news)) {
        console.error("Resposta da API Alpaca News sem array 'news' ou formato inesperado:", data)
        throw new Error("Resposta da API Alpaca News sem array 'news' ou formato inesperado.")
      }

      const news = data.news.map((item: any) => ({
        title: item.headline,
        source: item.source,
        date: new Date(item.created_at).toLocaleDateString("pt-BR"),
        url: item.url,
        symbols: item.symbols || [],
      }))
      return NextResponse.json({ news })
    } else if (type === "bars") {
      const timeframe = searchParams.get("timeframe") || "1D"
      const limit = searchParams.get("limit") || "100"
      if (!symbol) {
        return NextResponse.json({ error: "Necessita de símbolo." }, { status: 400 })
      }
      url = `${ALPACA_BASE_URL}/v2/crypto/${symbol.replace("/USDT", "")}/bars?timeframe=${timeframe}&limit=${limit}`
      response = await fetch(url, { headers })

      if (!response.ok) {
        const errorText = await response.text() 
        console.error(`Alpaca Bars API Error (${response.status}):`, errorText)
        throw new Error(`Falha ao buscar barras da Alpaca: ${response.status} - ${errorText}`)
      }

      rawResponseText = await response.text() 
      try {
        data = JSON.parse(rawResponseText) 
      } catch (jsonError: any) {
        console.error("Falha ao analisar a resposta JSON da API Alpaca Bars. Resposta:", rawResponseText)
        throw new Error(`A API Alpaca Bars retornou nJSON ou malformado: ${rawResponseText.substring(0, 200)}...`)
      }

      if (!data || !Array.isArray(data.bars)) {
        console.error("Resposta da API Alpaca Bars sem array 'bars' ou formato inesperado:", data)
        throw new Error("Formato inexperado. Verifique a documentação https://docs.alpaca.markets/docs/websocket-streaming")
      }

      return NextResponse.json({ bars: data.bars })
    } else {
      return NextResponse.json({ error: "Tipo de API invalida." }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Erro no backend da API:", error.message)
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 })
  }
}
