
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type ComparatorItem = {
  id: string
  nome: string
  precoInput: string
  unidadeInput: string
}

type ComparatorProps = {
  product: ComparatorItem
  onChange: (changes: Partial<ComparatorItem>) => void
}

export function parseDecimal(value: string): number {
  const cleaned = value.trim().replace(/\s/g, "")

  if (!cleaned) return 0

  const lastComma = cleaned.lastIndexOf(",")
  const lastDot = cleaned.lastIndexOf(".")

  let normalized = cleaned

  if (lastComma > lastDot) {
    normalized = cleaned
      .replace(/\./g, "")
      .replace(",", ".")
  } else if (lastDot > lastComma && lastComma >= 0) {
    normalized = cleaned.replace(/,/g, "")
  } else if (lastComma >= 0) {
    normalized = cleaned.replace(",", ".")
  }

  const number = Number(normalized)

  return Number.isFinite(number)
    ? number
    : 0
}

export function formatComparatorPrice(
  value: number
): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatUnitPrice(
  value: number
): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
}

function sanitizeDecimal(value: string): string {
  let sanitized = value.replace(/\./g, ",")
  sanitized = sanitized.replace(/[^\d,]/g, "")

  const parts = sanitized.split(",")

  if (parts.length > 1) {
    return `${parts[0]},${parts
      .slice(1)
      .join("")}`
  }

  return sanitized
}

function PriceComparator({
  product,
  onChange
}: ComparatorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: product.id
  })

  const price = parseDecimal(product.precoInput)
  const quantity = parseDecimal(product.unidadeInput)

  const pricePerUnit =
    quantity > 0
      ? price / quantity
      : null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: "relative" as const
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`productWrapper ${isDragging ? "dragging" : ""
        }`}
    >
      <div className="productCard comparatorCard">
        <div
          className="comparatorHeader cardDragArea"
          {...attributes}
          {...listeners}
          onContextMenu={event =>
            event.preventDefault()
          }
          aria-label="Segure a parte superior para mover o produto"
        >
          <input
            type="text"
            className="productNameInput"
            aria-label="Nome do produto"
            value={product.nome}
            onChange={event =>
              onChange({
                nome: event.target.value
              })
            }
            onPointerDown={event =>
              event.stopPropagation()
            }
            onMouseDown={event =>
              event.stopPropagation()
            }
            onTouchStart={event =>
              event.stopPropagation()
            }
          />
        </div>

        <div className="comparatorFields">
          <div className="productPriceField">
            <label
              htmlFor={`price-${product.id}`}
            >
              Preço
            </label>

            <div className="priceInputWrapper">
              <span>R$</span>

              <input
                id={`price-${product.id}`}
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={product.precoInput}
                onChange={event =>
                  onChange({
                    precoInput: sanitizeDecimal(
                      event.target.value
                    )
                  })
                }
              />
            </div>
          </div>

          <div className="productQuantityField">
            <label
              htmlFor={`unit-${product.id}`}
            >
              Unidade / gramas
            </label>

            <input
              id={`unit-${product.id}`}
              className="comparatorUnitInput"
              type="text"
              inputMode="decimal"
              placeholder="Ex.: 500"
              value={product.unidadeInput}
              onChange={event =>
                onChange({
                  unidadeInput: sanitizeDecimal(
                    event.target.value
                  )
                })
              }
            />
          </div>
        </div>

        <div className="productTotal comparatorResult">
          <span>
            Valor por unidade / grama
          </span>

          <strong>
            {pricePerUnit === null
              ? "R$ —"
              : `R$ ${formatUnitPrice(pricePerUnit)}`}
          </strong>

          <small>
            {pricePerUnit === null
              ? "Informe uma quantidade maior que zero"
              : "Preço ÷ quantidade informada"}
          </small>
        </div>
      </div>
    </div>
  )
}

export default PriceComparator
