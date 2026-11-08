
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import "./styles.css"

import type { RecipeData } from "./RecipeTypes"

type RecipeProps = {
  recipe: RecipeData
  onOpen: () => void
  onImport: () => void
}

function Recipe({
  recipe,
  onOpen,
  onImport
}: RecipeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `recipe-${recipe.id}`
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: "relative" as const
  }

  const ingredientCount = recipe.components.reduce(
    (total, component) => {
      if (component.type !== "ingredients") {
        return total
      }

      return total + component.ingredients.length
    },
    0
  )

  const componentCount = recipe.components.length

  function handleOpen() {
    if (isDragging) return

    onOpen()
  }

  function handleImport(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation()

    if (isDragging) return

    onImport()
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
      className={`productWrapper recipeWrapper ${isDragging ? "dragging" : ""
        }`}
    >
      <div className="productCard recipeCard">
        <div
          className="recipeCardHeader cardDragArea"
          {...attributes}
          {...listeners}
          onContextMenu={event =>
            event.preventDefault()
          }
          aria-label={`Segure para mover a receita ${recipe.name}`}
        >
          <button
            type="button"
            className="recipeCardTitle"
            onClick={handleOpen}
            onPointerDown={stopDragStart}
            onMouseDown={stopDragStart}
            onTouchStart={stopDragStart}
            aria-label={`Visualizar receita ${recipe.name}`}
          >
            <strong>{recipe.name}</strong>

            <small>
              {componentCount}{" "}
              {componentCount === 1
                ? "componente"
                : "componentes"}
              {" · "}
              {ingredientCount}{" "}
              {ingredientCount === 1
                ? "ingrediente"
                : "ingredientes"}
            </small>
          </button>

          <button
            type="button"
            className="recipeCardAddButton"
            onClick={handleImport}
            onPointerDown={stopDragStart}
            onMouseDown={stopDragStart}
            onTouchStart={stopDragStart}
            aria-label={`Adicionar todos os ingredientes de ${recipe.name} à Lista Mercado`}
            title="Adicionar ingredientes à Lista Mercado"
            disabled={ingredientCount === 0}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          <button
            type="button"
            className="recipeCardChevron"
            onClick={handleOpen}
            onPointerDown={stopDragStart}
            onMouseDown={stopDragStart}
            onTouchStart={stopDragStart}
            aria-label={`Abrir receita ${recipe.name}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Recipe
