'use client'

import { useRef, useState } from 'react'
import { MAX_QUANTITY_PER_LINE } from '@/lib/cart'

type QuantityStepperProps = {
  name: string
  quantity: number
  onChange: (quantity: number) => void
}

export function QuantityStepper({ name, quantity, onChange }: QuantityStepperProps) {
  // While the shopper is typing, the raw text is kept here; otherwise the stored quantity shows.
  const [draft, setDraft] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // A quantity change from outside (another tab, a button) replaces any half-typed draft.
  const [shownQuantity, setShownQuantity] = useState(quantity)
  if (shownQuantity !== quantity) {
    setShownQuantity(quantity)
    setDraft(null)
  }

  // A button that disables while focused drops focus to <body>; park it on the input instead.
  function step(next: number) {
    if (next <= 1 || next >= MAX_QUANTITY_PER_LINE) inputRef.current?.focus()
    onChange(next)
  }

  function handleInput(text: string) {
    if (/^\d+$/.test(text)) {
      const n = Number(text)
      if (n >= 1 && n <= MAX_QUANTITY_PER_LINE) {
        setDraft(null)
        onChange(n)
        return
      }
    }
    setDraft(text)
  }

  // On blur or Enter: out-of-range numbers clamp, anything else reverts to the stored quantity.
  function settle() {
    if (draft !== null && /^\d+$/.test(draft)) {
      onChange(Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, Number(draft))))
    }
    setDraft(null)
  }

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__button"
        aria-label={`Decrease quantity of ${name}`}
        disabled={quantity <= 1}
        onClick={() => step(quantity - 1)}
      >
        <span aria-hidden="true">&minus;</span>
      </button>
      <input
        ref={inputRef}
        className="stepper__input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={`Quantity, ${name}`}
        value={draft ?? String(quantity)}
        onChange={(e) => handleInput(e.target.value)}
        onBlur={settle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') settle()
        }}
      />
      <button
        type="button"
        className="stepper__button"
        aria-label={`Increase quantity of ${name}`}
        disabled={quantity >= MAX_QUANTITY_PER_LINE}
        onClick={() => step(quantity + 1)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}
