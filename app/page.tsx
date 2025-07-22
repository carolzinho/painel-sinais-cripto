import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-2xl bg-card border-primary shadow-soft rounded-3xl hover:scale-[1.01] transition-transform duration-300 ease-in-out">
        <CardHeader className="text-center">
          <CardTitle className="text-5xl font-bold text-primary mb-4">Crypto Signals Dashboard</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Desvende o mercado de criptomoedas com insights em tempo real e sinais inteligentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="text-md text-center max-w-prose text-foreground/80">
            Obtenha uma visão clara do sentimento do mercado, acompanhe gráficos de suas moedas favoritas, receba as
            últimas notícias e configure alertas personalizados para nunca perder uma oportunidade. Tudo em uma
            interface elegante e responsiva.
          </p>
          <Link href="/dashboard">
            <Button className="px-8 py-4 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 rounded-xl shadow-md hover:shadow-lg">
              Acessar Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
