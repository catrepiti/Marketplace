'use client'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AiSuggestButtonProps {
  onSuggestion: (text: string) => void
  payload: Record<string, string | number | undefined>
  className?: string
}

export function AiSuggestButton({ onSuggestion, payload, className }: AiSuggestButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
      onSuggestion(json.suggestion)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-800 transition-colors',
          loading && 'opacity-70 cursor-wait',
          className
        )}
      >
        <Sparkles className={cn('h-3.5 w-3.5', loading && 'animate-pulse')} />
        {loading ? 'Gerando sugestão...' : 'Sugerir com IA'}
      </Button>
      {error && (
        <p className="text-[11px] text-red-500">{error}</p>
      )}
    </div>
  )
}
