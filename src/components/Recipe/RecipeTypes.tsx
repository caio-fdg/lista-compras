
export type IngredientUnit =
  | "unidade"
  | "xicara"
  | "colher"
  | "gramas"
  | "quilos"
  | "litros"
  | "miligramas"
  | "mililitros"
  | "pitada"
  | "a_gosto"

export type IngredientSize =
  | "cafe"
  | "cha"
  | "sobremesa"
  | "sopa"
  | null

export interface RecipeIngredient {
  id: string
  name: string
  quantity: string
  unit: IngredientUnit
  size: IngredientSize
}

export interface RecipeIngredientsComponent {
  id: string
  type: "ingredients"
  title: string
  ingredients: RecipeIngredient[]
}

export interface RecipePreparationComponent {
  id: string
  type: "preparation"
  title: string
  content: string
}

export type RecipeComponent =
  | RecipeIngredientsComponent
  | RecipePreparationComponent

export interface RecipeData {
  id: string
  name: string
  components: RecipeComponent[]
  createdAt: string
  updatedAt: string
}
