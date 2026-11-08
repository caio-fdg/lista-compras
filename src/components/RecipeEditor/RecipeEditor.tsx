
import { useState } from "react"

import "../Recipe/styles.css"

import type {
  RecipeData,
  RecipeComponent,
  RecipeIngredient,
  RecipeIngredientsComponent,
  RecipePreparationComponent
} from "../Recipe/RecipeTypes"

import IngredientModal from "../IngredientModal/IngredientModal"

import {
  formatIngredient,
  normalizePreparation
} from "../Recipe/RecipeUtils"

type RecipeEditorProps = {
  recipe: RecipeData
  onSave: (recipe: RecipeData) => void
  onCancel: () => void
}

type IngredientEditorState = {
  componentId: string
  ingredient: RecipeIngredient | null
}

type ComponentType = "ingredients" | "preparation"

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()}`
}

function RecipeEditor({
  recipe,
  onSave,
  onCancel
}: RecipeEditorProps) {
  const [draft, setDraft] = useState<RecipeData>(() =>
    structuredClone(recipe)
  )

  const [expandedComponents, setExpandedComponents] =
    useState<string[]>(
      recipe.components.map(component => component.id)
    )

  const [componentModalOpen, setComponentModalOpen] =
    useState(false)

  const [ingredientEditor, setIngredientEditor] =
    useState<IngredientEditorState | null>(null)

  const [componentToDelete, setComponentToDelete] =
    useState<string | null>(null)

  const [ingredientToDelete, setIngredientToDelete] =
    useState<{
      componentId: string
      ingredientId: string
    } | null>(null)

  const [error, setError] = useState("")

  function updateRecipeName(name: string) {
    setDraft(prev => ({
      ...prev,
      name
    }))

    if (error) setError("")
  }

  function updateComponent(
    componentId: string,
    changes: Partial<RecipeComponent>
  ) {
    setDraft(prev => ({
      ...prev,
      components: prev.components.map(component =>
        component.id === componentId
          ? ({
            ...component,
            ...changes
          } as RecipeComponent)
          : component
      )
    }))
  }

  function toggleComponent(componentId: string) {
    setExpandedComponents(prev =>
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    )
  }

  function addComponent(type: ComponentType) {
    const id = createId()

    let component: RecipeComponent

    if (type === "ingredients") {
      component = {
        id,
        type: "ingredients",
        title: "Ingredientes",
        ingredients: []
      } satisfies RecipeIngredientsComponent
    } else {
      component = {
        id,
        type: "preparation",
        title: "Modo de preparo",
        content: ""
      } satisfies RecipePreparationComponent
    }

    setDraft(prev => ({
      ...prev,
      components: [
        ...prev.components,
        component
      ]
    }))

    setExpandedComponents(prev => [
      ...prev,
      id
    ])

    setComponentModalOpen(false)
  }

  function saveIngredient(
    componentId: string,
    ingredient: RecipeIngredient
  ) {
    setDraft(prev => ({
      ...prev,
      components: prev.components.map(component => {
        if (
          component.id !== componentId ||
          component.type !== "ingredients"
        ) {
          return component
        }

        const exists = component.ingredients.some(
          item => item.id === ingredient.id
        )

        return {
          ...component,
          ingredients: exists
            ? component.ingredients.map(item =>
              item.id === ingredient.id
                ? ingredient
                : item
            )
            : [
              ...component.ingredients,
              ingredient
            ]
        }
      })
    }))

    setIngredientEditor(null)
  }

  function deleteIngredient() {
    if (!ingredientToDelete) return

    const {
      componentId,
      ingredientId
    } = ingredientToDelete

    setDraft(prev => ({
      ...prev,
      components: prev.components.map(component => {
        if (
          component.id !== componentId ||
          component.type !== "ingredients"
        ) {
          return component
        }

        return {
          ...component,
          ingredients: component.ingredients.filter(
            ingredient => ingredient.id !== ingredientId
          )
        }
      })
    }))

    setIngredientToDelete(null)
  }

  function deleteComponent() {
    if (!componentToDelete) return

    setDraft(prev => ({
      ...prev,
      components: prev.components.filter(
        component => component.id !== componentToDelete
      )
    }))

    setExpandedComponents(prev =>
      prev.filter(id => id !== componentToDelete)
    )

    setComponentToDelete(null)
  }

  function moveComponent(
    componentId: string,
    direction: "up" | "down"
  ) {
    setDraft(prev => {
      const components = [...prev.components]

      const index = components.findIndex(
        component => component.id === componentId
      )

      const targetIndex =
        direction === "up"
          ? index - 1
          : index + 1

      if (
        index < 0 ||
        targetIndex < 0 ||
        targetIndex >= components.length
      ) {
        return prev
      }

      const [moved] = components.splice(index, 1)

      components.splice(targetIndex, 0, moved)

      return {
        ...prev,
        components
      }
    })
  }

  function moveIngredient(
    componentId: string,
    ingredientId: string,
    direction: "up" | "down"
  ) {
    setDraft(prev => ({
      ...prev,
      components: prev.components.map(component => {
        if (
          component.id !== componentId ||
          component.type !== "ingredients"
        ) {
          return component
        }

        const ingredients = [
          ...component.ingredients
        ]

        const index = ingredients.findIndex(
          ingredient => ingredient.id === ingredientId
        )

        const targetIndex =
          direction === "up"
            ? index - 1
            : index + 1

        if (
          index < 0 ||
          targetIndex < 0 ||
          targetIndex >= ingredients.length
        ) {
          return component
        }

        const [moved] = ingredients.splice(index, 1)

        ingredients.splice(targetIndex, 0, moved)

        return {
          ...component,
          ingredients
        }
      })
    }))
  }

  function handleSave() {
    const name = draft.name.trim()

    if (!name) {
      setError("Informe o nome da receita.")
      return
    }

    const normalizedComponents =
      draft.components.map(component => {
        if (component.type === "preparation") {
          return {
            ...component,
            title:
              component.title.trim() ||
              "Modo de preparo",
            content: normalizePreparation(
              component.content
            )
          }
        }

        return {
          ...component,
          title:
            component.title.trim() ||
            "Ingredientes"
        }
      })

    onSave({
      ...draft,
      name,
      components: normalizedComponents
    })
  }

  return (
    <div className="recipeEditor">
      <header className="recipeEditorHeader">
        <button
          type="button"
          className="recipeBackButton"
          onClick={onCancel}
          aria-label="Voltar sem salvar"
          title="Voltar"
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
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <input
          type="text"
          className="recipeEditorNameInput"
          value={draft.name}
          onChange={event =>
            updateRecipeName(event.target.value)
          }
          placeholder="Nome da receita"
          maxLength={100}
          aria-label="Nome da receita"
        />

        <button
          type="button"
          className="recipeSaveButton"
          onClick={handleSave}
          aria-label="Salvar receita"
          title="Salvar receita"
        >
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
            <path d="M17 21v-8H7v8" />
            <path d="M7 3v5h8" />
          </svg>
        </button>
      </header>

      {error && (
        <p className="recipeEditorError" role="alert">
          {error}
        </p>
      )}

      {draft.components.length === 0 && (
        <div className="recipeEditorEmpty">
          <p>
            Clique em adicionar para adicionar
            componentes.
          </p>
        </div>
      )}

      <div className="recipeEditorComponents">
        {draft.components.map(
          (component, componentIndex) => {
            const expanded =
              expandedComponents.includes(
                component.id
              )

            return (
              <section
                key={component.id}
                className="recipeComponentCard"
              >
                <div className="recipeComponentHeader">
                  <button
                    type="button"
                    className="recipeComponentChevron"
                    onClick={() =>
                      toggleComponent(component.id)
                    }
                    aria-expanded={expanded}
                    aria-label={
                      expanded
                        ? "Recolher componente"
                        : "Expandir componente"
                    }
                  >
                    {expanded ? "⌄" : "›"}
                  </button>

                  <strong className="recipeComponentHeaderTitle">
                    {component.title}
                  </strong>

                  <div className="recipeComponentHeaderActions">
                    <button
                      type="button"
                      onClick={() =>
                        moveComponent(
                          component.id,
                          "up"
                        )
                      }
                      disabled={componentIndex === 0}
                      aria-label="Mover componente para cima"
                      title="Mover para cima"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        moveComponent(
                          component.id,
                          "down"
                        )
                      }
                      disabled={
                        componentIndex ===
                        draft.components.length - 1
                      }
                      aria-label="Mover componente para baixo"
                      title="Mover para baixo"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      className="recipeDeleteButton"
                      onClick={() =>
                        setComponentToDelete(
                          component.id
                        )
                      }
                      aria-label="Excluir componente"
                      title="Excluir componente"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="recipeComponentBody">
                    {component.type ===
                      "ingredients" ? (
                      <>
                        <div className="recipeIngredientsToolbar">
                          <input
                            type="text"
                            className="recipeComponentTitleInput"
                            value={component.title}
                            onChange={event =>
                              updateComponent(
                                component.id,
                                {
                                  title:
                                    event.target.value
                                }
                              )
                            }
                            placeholder="Ingredientes"
                            aria-label="Título do grupo de ingredientes"
                          />

                          <button
                            type="button"
                            className="recipeIngredientAddButton"
                            onClick={() =>
                              setIngredientEditor({
                                componentId:
                                  component.id,
                                ingredient: null
                              })
                            }
                            aria-label="Adicionar ingrediente"
                            title="Adicionar ingrediente"
                          >
                            +
                          </button>
                        </div>

                        {component.ingredients.length ===
                          0 && (
                            <p className="recipeEmptyIngredients">
                              Nenhum ingrediente
                              cadastrado.
                            </p>
                          )}

                        <div className="recipeIngredientsList">
                          {component.ingredients.map(
                            (
                              ingredient,
                              ingredientIndex
                            ) => (
                              <div
                                key={ingredient.id}
                                className="recipeIngredientRow"
                              >
                                <span className="recipeIngredientText">
                                  {formatIngredient(
                                    ingredient
                                  )}
                                </span>

                                <div className="recipeIngredientActions">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveIngredient(
                                        component.id,
                                        ingredient.id,
                                        "up"
                                      )
                                    }
                                    disabled={
                                      ingredientIndex ===
                                      0
                                    }
                                    aria-label="Mover ingrediente para cima"
                                    title="Mover para cima"
                                  >
                                    ↑
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveIngredient(
                                        component.id,
                                        ingredient.id,
                                        "down"
                                      )
                                    }
                                    disabled={
                                      ingredientIndex ===
                                      component.ingredients
                                        .length -
                                      1
                                    }
                                    aria-label="Mover ingrediente para baixo"
                                    title="Mover para baixo"
                                  >
                                    ↓
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setIngredientEditor({
                                        componentId:
                                          component.id,
                                        ingredient
                                      })
                                    }
                                    aria-label={`Editar ${ingredient.name}`}
                                    title="Editar ingrediente"
                                  >
                                    <svg
                                      width="17"
                                      height="17"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden="true"
                                    >
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
                                    </svg>
                                  </button>

                                  <button
                                    type="button"
                                    className="recipeDeleteButton"
                                    onClick={() =>
                                      setIngredientToDelete({
                                        componentId:
                                          component.id,
                                        ingredientId:
                                          ingredient.id
                                      })
                                    }
                                    aria-label={`Excluir ${ingredient.name}`}
                                    title="Excluir ingrediente"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="recipePreparationEditor">
                        <label
                          htmlFor={`preparation-title-${component.id}`}
                        >
                          Título
                        </label>

                        <input
                          id={`preparation-title-${component.id}`}
                          type="text"
                          className="recipeComponentTitleInput"
                          value={component.title}
                          onChange={event =>
                            updateComponent(
                              component.id,
                              {
                                title:
                                  event.target.value
                              }
                            )
                          }
                        />

                        <label
                          htmlFor={`preparation-content-${component.id}`}
                        >
                          Modo de preparo
                        </label>

                        <textarea
                          id={`preparation-content-${component.id}`}
                          className="recipePreparationTextarea"
                          value={component.content}
                          onChange={event =>
                            updateComponent(
                              component.id,
                              {
                                content:
                                  event.target.value
                              }
                            )
                          }
                          placeholder={
                            "Descreva o modo de preparo.\n\nCada linha será exibida como um parágrafo."
                          }
                          rows={8}
                        />

                        <small>
                          Cada quebra de linha cria
                          um parágrafo. Linhas vazias
                          consecutivas serão
                          ignoradas.
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )
          }
        )}
      </div>

      <button
        type="button"
        className="recipeAddComponentButton"
        onClick={() =>
          setComponentModalOpen(true)
        }
      >
        <span aria-hidden="true">+</span>
        Adicionar componente
      </button>

      {componentModalOpen && (
        <div
          className="confirmOverlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setComponentModalOpen(false)
            }
          }}
        >
          <div
            className="confirmModal recipeComponentModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipeComponentModalTitle"
          >
            <h3 id="recipeComponentModalTitle">
              Adicionar componente
            </h3>

            <p>
              Qual tipo de componente deseja
              adicionar à receita?
            </p>

            <div className="recipeComponentModalActions">
              <button
                type="button"
                onClick={() =>
                  addComponent("ingredients")
                }
              >
                Ingredientes
              </button>

              <button
                type="button"
                onClick={() =>
                  addComponent("preparation")
                }
              >
                Modo de preparo
              </button>

              <button
                type="button"
                className="cancelButton"
                onClick={() =>
                  setComponentModalOpen(false)
                }
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {ingredientEditor && (
        <IngredientModal
          ingredient={
            ingredientEditor.ingredient
          }
          onClose={() =>
            setIngredientEditor(null)
          }
          onSave={ingredient =>
            saveIngredient(
              ingredientEditor.componentId,
              ingredient
            )
          }
        />
      )}

      {componentToDelete && (
        <div className="confirmOverlay">
          <div
            className="confirmModal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deleteRecipeComponentTitle"
          >
            <h3 id="deleteRecipeComponentTitle">
              Excluir componente
            </h3>

            <p>
              Deseja excluir este componente
              e todo o seu conteúdo?
            </p>

            <div className="confirmActions">
              <button
                type="button"
                className="cancelButton"
                onClick={() =>
                  setComponentToDelete(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="confirmButton"
                onClick={deleteComponent}
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {ingredientToDelete && (
        <div className="confirmOverlay">
          <div
            className="confirmModal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deleteIngredientTitle"
          >
            <h3 id="deleteIngredientTitle">
              Excluir ingrediente
            </h3>

            <p>
              Deseja excluir este ingrediente
              da receita?
            </p>

            <div className="confirmActions">
              <button
                type="button"
                className="cancelButton"
                onClick={() =>
                  setIngredientToDelete(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="confirmButton"
                onClick={deleteIngredient}
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecipeEditor
