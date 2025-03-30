import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Cine virtual</h1>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription>Inicia sesión o regístrate para reservar tus entradas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Link href="/login" className="w-full">
              <Button className="w-full">Iniciar Sesión</Button>
            </Link>
            <Link href="/registro" className="w-full">
              <Button variant="outline" className="w-full">
                Crear Cuenta
              </Button>
            </Link>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">Las mejores películas en la mejor experiencia</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

