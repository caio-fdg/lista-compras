
import { useState } from "react"

import "./styles.css"

import type {
  RecipeIngredient
} from "../Recipe/RecipeTypes"

type IngredientModalProps = {
  ingredient: RecipeIngredient | null
  onSave: (ingredient: RecipeIngredient) => void
  onClose: () => void
}

type IngredientUnit =
  RecipeIngredient["unit"]

type IngredientSize =
  RecipeIngredient["size"]

const UNIT_OPTIONS: {
  value: IngredientUnit
  label: string
}[] = [
    { value: "unidade", label: "Unidade" },
    { value: "xicara", label: "Xícara" },
    { value: "colher", label: "Colher" },
    { value: "gramas", label: "Gramas" },
    { value: "quilos", label: "Quilos" },
    { value: "litros", label: "Litros" },
    { value: "miligramas", label: "Miligramas" },
    { value: "mililitros", label: "Mililitros" },
    { value: "pitada", label: "Pitada" },
    { value: "a_gosto", label: "A gosto" }
  ]

const CUP_SIZE_OPTIONS: {
  value: IngredientSize
  label: string
}[] = [
    { value: "cafe", label: "Café" },
    { value: "cha", label: "Chá" }
  ]

const SPOON_SIZE_OPTIONS: {
  value: IngredientSize
  label: string
}[] = [
    { value: "cafe", label: "Café" },
    { value: "cha", label: "Chá" },
    { value: "sobremesa", label: "Sobremesa" },
    { value: "sopa", label: "Sopa" }
  ]

function createIngredientId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()}`
}

function IngredientModal({
  ingredient,
  onSave,
  onClose
}: IngredientModalProps) {
  const [name, setName] = useState(
    ingredient?.name ?? ""
  )

  const [quantity, setQuantity] = useState(
    ingredient?.quantity ?? "1"
  )

  const [unit, setUnit] = useState<IngredientUnit>(
    ingredient?.unit ?? "unidade"
  )

  const [size, setSize] = useState<IngredientSize>(
    ingredient?.size ?? null
  )

  const [showSizesHelp, setShowSizesHelp] =
    useState(false)

  const [error, setError] = useState("")

  const needsSize =
    unit === "xicara" || unit === "colher"

  const sizeOptions =
    unit === "xicara"
      ? CUP_SIZE_OPTIONS
      : SPOON_SIZE_OPTIONS

  function handleUnitChange(
    value: IngredientUnit
  ) {
    setUnit(value)
    setError("")

    if (value === "xicara") {
      setSize("cha")
    } else if (value === "colher") {
      setSize("sopa")
    } else {
      setSize(null)
    }
  }

  function handleSave() {
    const normalizedName = name.trim()
    const normalizedQuantity = quantity.trim()

    if (!normalizedName) {
      setError("Informe o nome do ingrediente.")
      return
    }

    if (
      unit !== "a_gosto" &&
      !normalizedQuantity
    ) {
      setError("Informe a quantidade.")
      return
    }

    if (
      needsSize &&
      !size
    ) {
      setError("Selecione o tamanho da medida.")
      return
    }

    const updatedIngredient: RecipeIngredient = {
      id: ingredient?.id ?? createIngredientId(),
      name: normalizedName,
      quantity:
        unit === "a_gosto"
          ? ""
          : normalizedQuantity,
      unit,
      size: needsSize ? size : null
    }

    onSave(updatedIngredient)
  }

  function handleBackdropClick(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <div
        className="confirmOverlay ingredientModalOverlay"
        onMouseDown={handleBackdropClick}
      >
        <div
          className="confirmModal ingredientModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ingredientModalTitle"
        >
          <div className="ingredientModalHeader">
            <h3 id="ingredientModalTitle">
              {ingredient
                ? "Editar ingrediente"
                : "Adicionar ingrediente"}
            </h3>

            <button
              type="button"
              className="ingredientModalClose"
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="ingredientModalFields">
            <label htmlFor="ingredient-name">
              Nome do ingrediente
            </label>

            <input
              id="ingredient-name"
              type="text"
              value={name}
              onChange={event => {
                setName(event.target.value)
                setError("")
              }}
              placeholder="Ex.: Açúcar"
              maxLength={120}
              autoFocus
            />

            {unit !== "a_gosto" && (
              <>
                <label htmlFor="ingredient-quantity">
                  Quantidade
                </label>

                <input
                  id="ingredient-quantity"
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={event => {
                    setQuantity(event.target.value)
                    setError("")
                  }}
                  placeholder="Ex.: 3, 0,5 ou 1/2"
                />

                <small className="ingredientQuantityHint">
                  Aceita números inteiros, decimais
                  e frações, como 1/2 ou 1 1/2.
                </small>
              </>
            )}

            <label htmlFor="ingredient-unit">
              Unidade de medida
            </label>

            <select
              id="ingredient-unit"
              value={unit}
              onChange={event =>
                handleUnitChange(
                  event.target.value as IngredientUnit
                )
              }
            >
              {UNIT_OPTIONS.map(option => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {needsSize && (
              <>
                <div className="ingredientSizeLabelRow">
                  <label htmlFor="ingredient-size">
                    Tamanho da medida
                  </label>

                  <button
                    type="button"
                    className="ingredientSizeHelpLink"
                    onClick={() =>
                      setShowSizesHelp(true)
                    }
                  >
                    Não sei os tamanhos
                  </button>
                </div>

                <select
                  id="ingredient-size"
                  value={size ?? ""}
                  onChange={event =>
                    setSize(
                      event.target.value as IngredientSize
                    )
                  }
                >
                  <option value="">
                    Selecione o tamanho
                  </option>

                  {sizeOptions.map(option => (
                    <option
                      key={option.value}
                      value={option.value ?? ""}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {error && (
            <p
              className="ingredientModalError"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="ingredientModalActions">
            <button
              type="button"
              className="cancelButton"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="confirmButton"
              onClick={handleSave}
            >
              OK
            </button>
          </div>
        </div>
      </div>

      {showSizesHelp && (
        <div
          className="confirmOverlay ingredientSizesOverlay"
          onMouseDown={event => {
            if (
              event.target === event.currentTarget
            ) {
              setShowSizesHelp(false)
            }
          }}
        >
          <div
            className="confirmModal ingredientSizesModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ingredientSizesTitle"
          >
            <div className="ingredientModalHeader">
              <h3 id="ingredientSizesTitle">
                Tamanhos das medidas
              </h3>

              <button
                type="button"
                className="ingredientModalClose"
                onClick={() =>
                  setShowSizesHelp(false)
                }
                aria-label="Fechar comparação"
              >
                ✕
              </button>
            </div>

            <p className="ingredientSizesDescription">
              Comparação ilustrativa dos
              tamanhos mais comuns.
            </p>

            <div className="ingredientSizesGuide">
              <h4>Xícaras</h4>

              <div className="ingredientSizesComparison">
                <div className="ingredientSizeExample">
                  <svg
                    viewBox="0 0 120 110"
                    role="img"
                    aria-label="Xícara pequena de café"
                  >
                    <path
                      d="M22 37H81V82Q81 91 70 91H33Q22 91 22 82Z"
                      fill="#DCECF7"
                      stroke="#64748B"
                      strokeWidth="3"
                    />

                    <path
                      d="M81 45H91Q109 45 109 60Q109 75 81 75"
                      fill="none"
                      stroke="#64748B"
                      strokeWidth="6"
                    />

                    <path
                      d="M22 53H81V82Q81 91 70 91H33Q22 91 22 82Z"
                      fill="#9CC7E8"
                    />
                  </svg>

                  <strong>Café</strong>
                  <small>Menor</small>
                </div>

                <div className="ingredientSizeExample">
                  <svg
                    viewBox="0 0 120 110"
                    role="img"
                    aria-label="Xícara maior de chá"
                  >
                    <path
                      d="M12 20H91V86Q91 97 79 97H24Q12 97 12 86Z"
                      fill="#DCECF7"
                      stroke="#64748B"
                      strokeWidth="3"
                    />

                    <path
                      d="M91 30H100Q115 30 115 55Q115 79 91 79"
                      fill="none"
                      stroke="#64748B"
                      strokeWidth="6"
                    />

                    <path
                      d="M12 43H91V86Q91 97 79 97H24Q12 97 12 86Z"
                      fill="#9CC7E8"
                    />
                  </svg>

                  <strong>Chá</strong>
                  <small>Maior</small>
                </div>
              </div>

              <h4>Colheres</h4>

              <div className="ingredientSpoonsComparison">
                {[
                  {
                    label: "Café",
                    width: 18,
                    length: 42
                  },
                  {
                    label: "Chá",
                    width: 23,
                    length: 51
                  },
                  {
                    label: "Sobremesa",
                    width: 29,
                    length: 60
                  },
                  {
                    label: "Sopa",
                    width: 35,
                    length: 70
                  }
                ].map(spoon => (
                  <div
                    className="ingredientSpoonExample"
                    key={spoon.label}
                  >
                    <svg
                      viewBox="0 0 100 110"
                      role="img"
                      aria-label={`Colher de ${spoon.label.toLowerCase()}`}
                    >
                      <ellipse
                        cx="50"
                        cy="25"
                        rx={spoon.width / 2}
                        ry={spoon.width * 0.75}
                        fill="#CBD5E1"
                        stroke="#64748B"
                        strokeWidth="2"
                      />

                      <rect
                        x="47"
                        y="40"
                        width="6"
                        height={spoon.length}
                        rx="3"
                        fill="#94A3B8"
                        stroke="#64748B"
                        strokeWidth="1"
                      />
                    </svg>

                    <strong>
                      {spoon.label}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <p className="ingredientSizesNote">
              As ilustrações são apenas
              comparativas. A capacidade real
              pode variar conforme o utensílio.
            </p>

            <button
              type="button"
              className="confirmButton ingredientSizesOkButton"
              onClick={() =>
                setShowSizesHelp(false)
              }
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default IngredientModal
