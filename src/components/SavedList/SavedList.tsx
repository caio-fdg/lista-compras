
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import "./styles.css"

import {
  type ProductItem,
  formatPrice,
  parsePrice
} from "../Product/Product"

export type SavedShoppingList = {
  id: string
  nome: string
  createdAt: string
  products: ProductItem[]
}

type SavedListProps = {
  list: SavedShoppingList
  expanded: boolean
  onToggle: () => void
  onImport: () => void
}

function SavedList({
  list,
  expanded,
  onToggle,
  onImport
}: SavedListProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `saved-${list.id}`
  })

  const total = list.products.reduce(
    (sum, product) =>
      sum +
      product.quantidade *
      parsePrice(product.precoInput),
    0
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
  }

  function stopDragStart(
    event: React.SyntheticEvent
  ) {
    event.stopPropagation()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`productWrapper savedListWrapper ${isDragging ? "dragging" : ""
        }`}
    >
      <div className="productCard savedListCard">
        <div
          className="savedListHeader cardDragArea"
          {...attributes}
          {...listeners}
          onContextMenu={event =>
            event.preventDefault()
          }
          aria-label={`Segure a parte superior para mover a lista ${list.nome}`}
        >
          {!expanded && (
            <button
              type="button"
              className="savedListAddButton"
              onClick={onImport}
              onPointerDown={stopDragStart}
              onMouseDown={stopDragStart}
              onTouchStart={stopDragStart}
              aria-label={`Adicionar produtos da lista ${list.nome}`}
              title="Adicionar à Lista Mercado"
            >
              +
            </button>
          )}

          <button
            type="button"
            className="savedListTitleButton"
            onClick={onToggle}
            onPointerDown={stopDragStart}
            onMouseDown={stopDragStart}
            onTouchStart={stopDragStart}
            aria-expanded={expanded}
          >
            <strong>{list.nome}</strong>

            <small>
              {list.products.length}{" "}
              {list.products.length === 1
                ? "produto"
                : "produtos"}
            </small>
          </button>

          <button
            type="button"
            className="chevronButton"
            onClick={onToggle}
            onPointerDown={stopDragStart}
            onMouseDown={stopDragStart}
            onTouchStart={stopDragStart}
            aria-label={
              expanded
                ? "Recolher lista"
                : "Expandir lista"
            }
            aria-expanded={expanded}
          >
            {expanded ? "⌃" : "⌄"}
          </button>
        </div>

        {expanded && (
          <div className="savedListDetails">
            <div className="savedListDetailsHeader">
              <button
                type="button"
                className="savedListAddButton"
                onClick={onImport}
                aria-label={`Adicionar produtos da lista ${list.nome}`}
                title="Adicionar à Lista Mercado"
              >
                +
              </button>

              <strong>{list.nome}</strong>
            </div>

            <div className="savedListTable">
              <div className="savedListTableHeading">
                <span>Produto</span>
                <span>Qtd.</span>
                <span>Preço un.</span>
              </div>

              {list.products.map(product => (
                <div
                  className="savedListProductRow"
                  key={product.id}
                >
                  <span>
                    {product.nome || "Produto"}
                  </span>

                  <span>
                    x{product.quantidade}
                  </span>

                  <span>
                    R$ {formatPrice(
                      parsePrice(
                        product.precoInput
                      )
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="savedListTotal">
              <span>Total da lista</span>

              <strong>
                R$ {formatPrice(total)}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedList
