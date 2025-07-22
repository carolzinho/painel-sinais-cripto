import { NextResponse } from "next/server"

const ALPACA_API_KEY = process.env.ALPACA_API_KEY
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY
const ALPACA_BASE_URL = "https://data.paper-api.alpaca.markets" // Correct base URL for paper data API

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const symbol = searchParams.get("symbol")

  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    return NextResponse.json({ error: "Alpaca API keys are not configured." }, { status: 500 })
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
        const errorText = await response.text() // Read error text if response is not ok
        console.error(`Alpaca News API Error (${response.status}):`, errorText)
        throw new Error(`Failed to fetch news from Alpaca: ${response.status} - ${errorText}`)
      }

      rawResponseText = await response.text() // Read the response body as text once
      try {
        data = JSON.parse(rawResponseText) // Attempt to parse the text as JSON
      } catch (jsonError: any) {
        console.error("Failed to parse JSON response from Alpaca News API. Raw response:", rawResponseText)
        throw new Error(`Alpaca News API returned non-JSON or malformed JSON: ${rawResponseText.substring(0, 200)}...`)
      }

      if (!data || !Array.isArray(data.news)) {
        console.error("Alpaca News API response missing 'news' array or unexpected format:", data)
        throw new Error("Alpaca News API response format unexpected. Check API documentation.")
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
        return NextResponse.json({ error: "Symbol is required for bars." }, { status: 400 })
      }
      url = `${ALPACA_BASE_URL}/v2/crypto/${symbol.replace("/USDT", "")}/bars?timeframe=${timeframe}&limit=${limit}`
      response = await fetch(url, { headers })

      if (!response.ok) {
        const errorText = await response.text() // Read error text if response is not ok
        console.error(`Alpaca Bars API Error (${response.status}):`, errorText)
        throw new Error(`Failed to fetch bars from Alpaca: ${response.status} - ${errorText}`)
      }

      rawResponseText = await response.text() // Read the response body as text once
      try {
        data = JSON.parse(rawResponseText) // Attempt to parse the text as JSON
      } catch (jsonError: any) {
        console.error("Failed to parse JSON response from Alpaca Bars API. Raw response:", rawResponseText)
        throw new Error(`Alpaca Bars API returned non-JSON or malformed JSON: ${rawResponseText.substring(0, 200)}...`)
      }

      if (!data || !Array.isArray(data.bars)) {
        console.error("Alpaca Bars API response missing 'bars' array or unexpected format:", data)
        throw new Error("Alpaca Bars API response format unexpected. Check API documentation.")
      }

      return NextResponse.json({ bars: data.bars })
    } else {
      return NextResponse.json({ error: "Invalid API type specified." }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Backend API error:", error.message)
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 })
  }
}
