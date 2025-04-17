import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { AlertCircle, PlusCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

function App() {
  const [count, setCount] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [showError, setShowError] = useState(false)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Teste Visual e Alias</h1>

      <Card>
        <CardHeader>
          <CardTitle>Contador de Teste</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-4">
          <span className="text-2xl font-mono">{count}</span>
          <Button onClick={() => setCount((c) => c + 1)}>Incrementar</Button>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">Clique no botão para testar.</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Input e Alerta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="test-input">Input de Teste</Label>
          <Input
            id="test-input"
            placeholder="Digite algo..."
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          />
          <Button variant="outline" onClick={() => setShowError(!showError)}>
            {showError ? 'Esconder Alerta' : 'Mostrar Alerta'}
          </Button>
          {showError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Alerta!</AlertTitle>
              <AlertDescription>
                Este é um alerta de teste do Shadcn/ui.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <PlusCircle className="mr-2 h-4 w-4" /> Abrir Dialog
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Dialog de Teste</DialogTitle>
              <DialogDescription>
                Este é um dialog de teste do Shadcn/ui.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              Conteúdo do Dialog.
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default App
