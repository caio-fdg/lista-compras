
import type {
  RecipeData,
  RecipeIngredient,
  IngredientUnit,
  IngredientSize
} from "./RecipeTypes"

import type {
  ProductItem
} from "../Product/Product"

const UNIT_LABELS: Record<
  IngredientUnit,
  [string, string]
> = {
  unidade: ["unidade", "unidades"],
  xicara: ["xícara", "xícaras"],
  colher: ["colher", "colheres"],
  gramas: ["grama", "gramas"],
  quilos: ["quilo", "quilos"],
  litros: ["litro", "litros"],
  miligramas: ["miligrama", "miligramas"],
  mililitros: ["mililitro", "mililitros"],
  pitada: ["pitada", "pitadas"],
  a_gosto: ["a gosto", "a gosto"]
}

const SIZE_LABELS: Record<
  Exclude<IngredientSize, null>,
  string
> = {
  cafe: "café",
  cha: "chá",
  sobremesa: "sobremesa",
  sopa: "sopa"
}

/**
 * Interpreta quantidades utilizadas em receitas.
 *
 * Exemplos:
 * "3"     -> 3
 * "0,5"   -> 0.5
 * "1/2"   -> 0.5
 * "1 1/2" -> 1.5
 * "2.5"   -> 2.5
 *
 * Retorna null quando o valor não é válido.
 */
export function parseRecipeQuantity(
  value: string
): number | null {
  const normalized = value.trim().replace(",", ".")

  if (!normalized) return null

  const mixedFraction = normalized.match(
    /^(\d+)\s+(\d+)\/(\d+)$/
  )

  if (mixedFraction) {
    const whole = Number(mixedFraction[1])
    const numerator = Number(mixedFraction[2])
    const denominator = Number(mixedFraction[3])

    if (denominator === 0) return null

    return whole + numerator / denominator
  }

  const fraction = normalized.match(
    /^(\d+)\/(\d+)$/
  )

  if (fraction) {
    const numerator = Number(fraction[1])
    const denominator = Number(fraction[2])

    if (denominator === 0) return null

    return numerator / denominator
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null
  }

  const number = Number(normalized)

  return Number.isFinite(number)
    ? number
    : null
}

/**
 * Converte o ingrediente em texto legível.
 *
 * Exemplo:
 * {
 *   name: "Açúcar",
 *   quantity: "3",
 *   unit: "xicara",
 *   size: "cha"
 * }
 *
 * Resultado:
 * "3 xícaras de chá de açúcar"
 */
export function formatIngredient(
  ingredient: RecipeIngredient
): string {
  const name = ingredient.name.trim()

  if (ingredient.unit === "a_gosto") {
    return `${name} a gosto`
  }

  const quantity = ingredient.quantity.trim()

  const parsedQuantity =
    parseRecipeQuantity(quantity)

  const singular = parsedQuantity === 1

  const [singularLabel, pluralLabel] =
    UNIT_LABELS[ingredient.unit]

  const unitLabel = singular
    ? singularLabel
    : pluralLabel

  let sizeLabel = ""

  if (
    (ingredient.unit === "xicara" ||
      ingredient.unit === "colher") &&
    ingredient.size
  ) {
    sizeLabel =
      SIZE_LABELS[ingredient.size] ?? ""
  }

  const measurement = [
    quantity,
    unitLabel,
    sizeLabel ? `de ${sizeLabel}` : ""
  ]
    .filter(Boolean)
    .join(" ")

  return `${measurement} de ${name}`
}

/**
 * Remove espaços desnecessários e normaliza
 * as quebras de linha do modo de preparo.
 *
 * Cada linha preenchida será exibida como
 * um parágrafo no visualizador da receita.
 */
export function normalizePreparation(
  content: string
): string {
  return content
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n")
}

/**
 * Obtém todos os ingredientes de uma receita,
 * respeitando a ordem dos grupos e ingredientes.
 */
export function getRecipeIngredients(
  recipe: RecipeData
): RecipeIngredient[] {
  return recipe.components.flatMap(component => {
    if (component.type !== "ingredients") {
      return []
    }

    return component.ingredients
  })
}

/**
 * Conta os ingredientes de uma receita.
 */
export function countRecipeIngredients(
  recipe: RecipeData
): number {
  return getRecipeIngredients(recipe).length
}

/**
 * Define a quantidade que será importada
 * para a Lista Mercado.
 *
 * Regras:
 * - Unidade: utiliza a quantidade da receita.
 * - Outras medidas: utiliza 1.
 *
 * A Lista Mercado trabalha com quantidades
 * inteiras. Por isso, quantidades fracionárias
 * em "unidade" são arredondadas para cima.
 */
export function getMarketQuantity(
  ingredient: RecipeIngredient
): number {
  if (ingredient.unit !== "unidade") {
    return 1
  }

  const parsed = parseRecipeQuantity(
    ingredient.quantity
  )

  if (
    parsed === null ||
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return 1
  }

  return Math.max(1, Math.ceil(parsed))
}

/**
 * Cria um produto da Lista Mercado a partir
 * de um ingrediente.
 *
 * O preço fica vazio para preenchimento
 * posterior pelo usuário.
 */
export function ingredientToMarketProduct(
  ingredient: RecipeIngredient,
  id: number
): ProductItem {
  return {
    id,
    nome: ingredient.name.trim(),
    quantidade: getMarketQuantity(ingredient),
    precoInput: "",
    expanded: false
  }
}

/**
 * Converte todos os ingredientes de uma receita
 * em produtos da Lista Mercado.
 *
 * O parâmetro startId define o primeiro ID
 * numérico disponível.
 */
export function recipeToMarketProducts(
  recipe: RecipeData,
  startId: number
): ProductItem[] {
  return getRecipeIngredients(recipe).map(
    (ingredient, index) =>
      ingredientToMarketProduct(
        ingredient,
        startId + index
      )
  )
}

/**
 * Cria uma receita vazia.
 *
 * Ela ainda não será salva no localStorage.
 * O salvamento será feito pelo App.tsx
 * quando o usuário clicar no disquete.
 */
export function createEmptyRecipe(
  name: string,
  id: string
): RecipeData {
  const now = new Date().toISOString()

  return {
    id,
    name: name.trim(),
    components: [],
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Atualiza a data de modificação da receita
 * antes de persistir as alterações.
 */
export function withUpdatedTimestamp(
  recipe: RecipeData
): RecipeData {
  return {
    ...recipe,
    updatedAt: new Date().toISOString()
  }
}
