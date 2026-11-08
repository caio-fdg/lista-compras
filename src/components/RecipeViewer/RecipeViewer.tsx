
import type { RecipeData } from "../Recipe/RecipeTypes"

import "../Recipe/styles.css"

import {
  formatIngredient,
  normalizePreparation
} from "../Recipe/RecipeUtils"

type RecipeViewerProps = {
  recipe: RecipeData
  onEdit: () => void
  onBack: () => void
}

function RecipeViewer({
  recipe,
  onEdit,
  onBack
}: RecipeViewerProps) {
  return (
    <div className="recipeViewer">
      <header className="recipeViewerHeader">
        <h1 className="recipeViewerTitle">
          {recipe.name}
        </h1>

        <button
          type="button"
          className="recipeViewerEditButton"
          onClick={onEdit}
          aria-label={`Editar receita ${recipe.name}`}
          title="Editar receita"
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
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
          </svg>
        </button>
      </header>

      <div className="recipeViewerContent">
        {recipe.components.length === 0 ? (
          <div className="recipeViewerEmpty">
            <p>
              Esta receita ainda não possui
              ingredientes ou modo de preparo.
            </p>
          </div>
        ) : (
          recipe.components.map(component => {
            if (component.type === "ingredients") {
              return (
                <section
                  key={component.id}
                  className="recipeViewerSection"
                >
                  <h2 className="recipeViewerSectionTitle">
                    {component.title || "Ingredientes"}
                  </h2>

                  {component.ingredients.length > 0 ? (
                    <ul className="recipeViewerIngredients">
                      {component.ingredients.map(
                        ingredient => (
                          <li key={ingredient.id}>
                            {formatIngredient(ingredient)}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="recipeViewerEmptyText">
                      Nenhum ingrediente cadastrado.
                    </p>
                  )}
                </section>
              )
            }

            const paragraphs = normalizePreparation(
              component.content
            )
              .split("\n")
              .map(paragraph => paragraph.trim())
              .filter(Boolean)

            return (
              <section
                key={component.id}
                className="recipeViewerSection"
              >
                <h2 className="recipeViewerSectionTitle">
                  {component.title || "Modo de preparo"}
                </h2>

                {paragraphs.length > 0 ? (
                  <div className="recipeViewerPreparation">
                    {paragraphs.map((paragraph, index) => (
                      <p
                        key={`${component.id}-${index}`}
                        className="recipeViewerParagraph"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="recipeViewerEmptyText">
                    Nenhuma instrução cadastrada.
                  </p>
                )}
              </section>
            )
          })
        )}
      </div>

      <div className="recipeViewerBackContainer">
        <button
          type="button"
          className="recipeViewerBackButton"
          onClick={onBack}
          aria-label="Voltar para lista de receitas"
          title="Voltar para receitas"
        >
          <svg
            width="22"
            height="22"
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

          <span>Voltar</span>
        </button>
      </div>
    </div>
  )
}

export default RecipeViewer
