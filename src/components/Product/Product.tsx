
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import "./styles.css"
import "./styles.css"

export type ProductItem = {
  id: number
  nome: string
  quantidade: number
  precoInput: string
  expanded: boolean
}

type ProductProps = {
  product: ProductItem
  onChange: (changes: Partial<ProductItem>) => void
}

export function parsePrice(value: string): number {
  const normalized = value
    .replace(/\./g, "")
    .replace(",", ".")

  const number = Number(normalized)

  return Number.isFinite(number)
    ? Math.round(number * 100)
    : 0
}

export function formatPrice(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function Product({ product, onChange }: ProductProps) {
  const {
    nome,
    quantidade,
    precoInput,
    expanded
  } = product

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `market-${product.id}`
  })

  const precoTotalCentavos =
    quantidade * parsePrice(precoInput)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: "relative" as const
  }

  function handlePriceChange(value: string) {
    let sanitized = value.replace(/\./g, ",")
    sanitized = sanitized.replace(/[^\d,]/g, "")

    const partes = sanitized.split(",")

    if (partes.length > 1) {
      sanitized = `${partes[0]},${partes
        .slice(1)
        .join("")
        .slice(0, 2)}`
    }

    onChange({ precoInput: sanitized })
  }

  function handlePriceBlur() {
    if (!precoInput.trim()) return

    onChange({
      precoInput: formatPrice(
        parsePrice(precoInput)
      )
    })
  }

  function productQuantityChange(
    operation: "+" | "-"
  ) {
    onChange({
      quantidade:
        operation === "+"
          ? quantidade + 1
          : Math.max(0, quantidade - 1)
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`productWrapper ${isDragging ? "dragging" : ""
        }`}
    >
      <div className="productCard">
        {expanded ? (
          <div className="productEdit">
            <div
              className="productEditTop cardDragArea"
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
                placeholder="Nome do produto"
                value={nome}
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

              <button
                type="button"
                className="chevronButton"
                onClick={() =>
                  onChange({
                    expanded: false
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
                aria-label="Recolher produto"
                aria-expanded={true}
              >
                ⌃
              </button>
            </div>

            <div className="productEditRow">
              <div className="productPriceField">
                <label
                  htmlFor={`price-${product.id}`}
                >
                  Preço unitário
                </label>

                <div className="priceInputWrapper">
                  <span>R$</span>

                  <input
                    id={`price-${product.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={precoInput}
                    onChange={event =>
                      handlePriceChange(
                        event.target.value
                      )
                    }
                    onBlur={handlePriceBlur}
                  />
                </div>
              </div>

              <div className="productQuantityField">
                <span className="fieldLabel">
                  Quantidade
                </span>

                <div className="produtoQuantidade">
                  <button
                    type="button"
                    onClick={() =>
                      productQuantityChange("-")
                    }
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>

                  <p>{quantidade}</p>

                  <button
                    type="button"
                    onClick={() =>
                      productQuantityChange("+")
                    }
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="productTotal">
              <span>Preço total</span>

              <strong>
                R$ {formatPrice(precoTotalCentavos)}
              </strong>
            </div>
          </div>
        ) : (
          <div
            className="productTop cardDragArea"
            {...attributes}
            {...listeners}
            onContextMenu={event =>
              event.preventDefault()
            }
            aria-label="Segure a parte superior para mover o produto"
          >
            <div className="productHeader">
              <div className="productInfo">
                <strong>
                  {nome || "Produto"}
                </strong>

                <span>x{quantidade}</span>
              </div>

              <div className="productSummary">
                <strong>
                  R$ {formatPrice(precoTotalCentavos)}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="chevronButton"
              onClick={() =>
                onChange({
                  expanded: true
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
              aria-expanded={false}
              aria-label="Expandir produto"
            >
              ⌄
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Product
