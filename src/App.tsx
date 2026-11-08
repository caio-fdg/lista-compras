
import { useEffect, useState } from "react"
import type { ReactNode } from "react"

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
  closestCenter,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core"

import type {
  CollisionDetection,
  DragEndEvent,
  DragStartEvent
} from "@dnd-kit/core"

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable"

import Product, {
  type ProductItem,
  formatPrice,
  parsePrice
} from "./components/Product/Product"

import PriceComparator, {
  type ComparatorItem
} from "./components/PriceComparator/PriceComparator"

import SavedList, {
  type SavedShoppingList
} from "./components/SavedList/SavedList"

import Recipe from "./components/Recipe/Recipe"

import RecipeEditor from "./components/RecipeEditor/RecipeEditor"

import RecipeViewer from "./components/RecipeViewer/RecipeViewer"

import type {
  RecipeData
} from "./components/Recipe/RecipeTypes"

import {
  createEmptyRecipe,
  recipeToMarketProducts,
  withUpdatedTimestamp
} from "./components/Recipe/RecipeUtils"

import "./App.css"

type Page =
  | "market"
  | "comparator"
  | "lists"
  | "recipes"

type RecipeScreen =
  | "list"
  | "view"
  | "edit"

type ImportMode =
  | "append"
  | "replace"

type ImportRequest = {
  name: string
  products: ProductItem[]
  recipe: boolean
}

const STORAGE_KEYS = {
  market: "lista-mercado-products",
  comparator: "lista-mercado-comparators",
  comparatorCount: "lista-mercado-comparator-count",
  savedLists: "lista-mercado-saved-lists",
  recipes: "lista-mercado-recipes",
  theme: "lista-mercado-theme"
}

const TRASH_ID = "product-trash"

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()}`
}

function readStorage<T>(
  key: string,
  fallback: T
): T {
  try {
    const stored = localStorage.getItem(key)

    return stored === null
      ? fallback
      : JSON.parse(stored) as T
  } catch {
    return fallback
  }
}

function saveStorage<T>(
  key: string,
  value: T
) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    )
  } catch (error) {
    console.error(
      "Erro ao salvar no localStorage:",
      error
    )
  }
}

function isProductItem(
  value: unknown
): value is ProductItem {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false
  }

  const item = value as ProductItem

  return (
    typeof item.id === "number" &&
    typeof item.nome === "string" &&
    typeof item.quantidade === "number" &&
    typeof item.precoInput === "string" &&
    typeof item.expanded === "boolean"
  )
}

function loadProducts(): ProductItem[] {
  const data = readStorage<unknown>(
    STORAGE_KEYS.market,
    []
  )

  return Array.isArray(data)
    ? data.filter(isProductItem)
    : []
}

function loadComparators(): ComparatorItem[] {
  const data = readStorage<unknown>(
    STORAGE_KEYS.comparator,
    []
  )

  if (!Array.isArray(data)) return []

  return data.filter(
    (item): item is ComparatorItem =>
      item !== null &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.nome === "string" &&
      typeof item.precoInput === "string" &&
      typeof item.unidadeInput === "string"
  )
}

function loadSavedLists(): SavedShoppingList[] {
  const data = readStorage<unknown>(
    STORAGE_KEYS.savedLists,
    []
  )

  if (!Array.isArray(data)) return []

  return data.filter(
    (item): item is SavedShoppingList =>
      item !== null &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.nome === "string" &&
      Array.isArray(item.products)
  )
}

function loadRecipes(): RecipeData[] {
  const data = readStorage<unknown>(
    STORAGE_KEYS.recipes,
    []
  )

  if (!Array.isArray(data)) return []

  return data.filter(
    (item): item is RecipeData =>
      item !== null &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      Array.isArray(item.components)
  )
}

function nextProductId(
  products: ProductItem[]
): number {
  return Math.max(
    Date.now(),
    0,
    ...products.map(item => item.id)
  ) + 1
}

function cloneImportedProducts(
  items: ProductItem[],
  existing: ProductItem[]
): ProductItem[] {
  const startId = nextProductId(existing)

  return items.map((item, index) => ({
    ...item,
    id: startId + index,
    expanded: false
  }))
}

function reorderItems<T>(
  items: T[],
  getId: (item: T) => string,
  activeId: string,
  overId: string
): T[] {
  const oldIndex = items.findIndex(
    item => getId(item) === activeId
  )

  const newIndex = items.findIndex(
    item => getId(item) === overId
  )

  if (
    oldIndex < 0 ||
    newIndex < 0 ||
    oldIndex === newIndex
  ) {
    return items
  }

  return arrayMove(
    items,
    oldIndex,
    newIndex
  )
}

const collisionDetection: CollisionDetection = args => {
  const trash = args.droppableContainers.find(
    container => container.id === TRASH_ID
  )

  if (trash) {
    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: [trash]
    })

    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    if (!args.pointerCoordinates) {
      const rectangleCollisions = rectIntersection({
        ...args,
        droppableContainers: [trash]
      })

      if (rectangleCollisions.length > 0) {
        return rectangleCollisions
      }
    }
  }

  return closestCenter({
    ...args,
    droppableContainers:
      args.droppableContainers.filter(
        container => container.id !== TRASH_ID
      )
  })
}

function TrashZone({
  visible
}: {
  visible: boolean
}) {
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id: TRASH_ID,
    disabled: !visible
  })

  return (
    <div
      ref={setNodeRef}
      className={[
        "trashZone",
        visible ? "visible" : "",
        isOver ? "trashZoneActive" : ""
      ].join(" ")}
    >
      <div className="trashBackground">
        ✕
      </div>
    </div>
  )
}

type ModalProps = {
  title: string
  children: ReactNode
  onClose: () => void
}

function Modal({
  title,
  children,
  onClose
}: ModalProps) {
  return (
    <div
      className="confirmOverlay"
      onMouseDown={event => {
        if (
          event.target === event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div
        className="confirmModal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modalTitle">
          <h3>{title}</h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

type SideMenuProps = {
  open: boolean
  page: Page
  darkMode: boolean
  onClose: () => void
  onNavigate: (page: Page) => void
  onOpenSettings: () => void
  onToggleTheme: () => void
}

function SideMenu({
  open,
  page,
  darkMode,
  onClose,
  onNavigate,
  onOpenSettings,
  onToggleTheme
}: SideMenuProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      )
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="sideMenuOverlay"
      onMouseDown={event => {
        if (
          event.target === event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <aside className="sideMenu">
        <div className="sideMenuHeader">
          <strong>Menu</strong>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <nav className="sideMenuNavigation">
          <div className="sideMenuMarketRow">
            <button
              type="button"
              className={
                page === "market"
                  ? "active"
                  : ""
              }
              onClick={() =>
                onNavigate("market")
              }
            >
              Lista Mercado
            </button>

            <button
              type="button"
              className="sideMenuSettingsButton"
              onClick={onOpenSettings}
              aria-label="Configurações da Lista Mercado"
              title="Configurações"
            >
              ⚙
            </button>
          </div>

          <button
            type="button"
            className={
              page === "comparator"
                ? "active"
                : ""
            }
            onClick={() =>
              onNavigate("comparator")
            }
          >
            Comparador de Preços
          </button>

          <button
            type="button"
            className={
              page === "lists"
                ? "active"
                : ""
            }
            onClick={() =>
              onNavigate("lists")
            }
          >
            Listas
          </button>

          <button
            type="button"
            className={
              page === "recipes"
                ? "active"
                : ""
            }
            onClick={() =>
              onNavigate("recipes")
            }
          >
            Receitas
          </button>
        </nav>

        <div className="sideMenuTheme">
          <span>
            {darkMode
              ? "Tema escuro"
              : "Tema claro"}
          </span>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Alternar tema"
          >
            {darkMode ? "☾" : "☀"}
          </button>
        </div>
      </aside>
    </div>
  )
}

function App() {
  const [page, setPage] =
    useState<Page>("market")

  const [products, setProducts] =
    useState<ProductItem[]>(loadProducts)

  const [comparators, setComparators] =
    useState<ComparatorItem[]>(
      loadComparators
    )

  const [savedLists, setSavedLists] =
    useState<SavedShoppingList[]>(
      loadSavedLists
    )

  const [recipes, setRecipes] =
    useState<RecipeData[]>(loadRecipes)

  const [comparatorCount, setComparatorCount] =
    useState(() =>
      readStorage<number>(
        STORAGE_KEYS.comparatorCount,
        0
      )
    )

  const [darkMode, setDarkMode] =
    useState(() =>
      readStorage<string>(
        STORAGE_KEYS.theme,
        "light"
      ) === "dark"
    )

  const [menuOpen, setMenuOpen] =
    useState(false)

  const [
    marketSettingsOpen,
    setMarketSettingsOpen
  ] = useState(false)

  const [
    saveListModalOpen,
    setSaveListModalOpen
  ] = useState(false)

  const [saveListName, setSaveListName] =
    useState("")

  const [
    clearMarketConfirm,
    setClearMarketConfirm
  ] = useState(false)

  const [
    expandedSavedListIds,
    setExpandedSavedListIds
  ] = useState<string[]>([])

  const [importRequest, setImportRequest] =
    useState<ImportRequest | null>(null)

  const [activeId, setActiveId] =
    useState<string | null>(null)

  const [deleteId, setDeleteId] =
    useState<string | null>(null)

  const [recipeScreen, setRecipeScreen] =
    useState<RecipeScreen>("list")

  const [
    selectedRecipeId,
    setSelectedRecipeId
  ] = useState<string | null>(null)

  const [
    createRecipeModalOpen,
    setCreateRecipeModalOpen
  ] = useState(false)

  const [newRecipeName, setNewRecipeName] =
    useState("")

  const [draftRecipe, setDraftRecipe] =
    useState<RecipeData | null>(null)

  useEffect(() => {
    saveStorage(
      STORAGE_KEYS.market,
      products
    )
  }, [products])

  useEffect(() => {
    saveStorage(
      STORAGE_KEYS.comparator,
      comparators
    )
  }, [comparators])

  useEffect(() => {
    saveStorage(
      STORAGE_KEYS.savedLists,
      savedLists
    )
  }, [savedLists])

  useEffect(() => {
    saveStorage(
      STORAGE_KEYS.recipes,
      recipes
    )
  }, [recipes])

  useEffect(() => {
    saveStorage(
      STORAGE_KEYS.comparatorCount,
      comparatorCount
    )
  }, [comparatorCount])

  useEffect(() => {
    saveStorage(
      STORAGE_KEYS.theme,
      darkMode ? "dark" : "light"
    )

    document.documentElement.style.colorScheme =
      darkMode ? "dark" : "light"

    document.documentElement.dataset.theme =
      darkMode ? "dark" : "light"

    document.body.classList.toggle(
      "dark",
      darkMode
    )
  }, [darkMode])

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 600,
        tolerance: 8
      }
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 600,
        tolerance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter:
        sortableKeyboardCoordinates
    })
  )

  const selectedRecipe =
    recipes.find(
      recipe =>
        recipe.id === selectedRecipeId
    ) ?? null

  const isRecipeDetail =
    page === "recipes" &&
    recipeScreen !== "list"

  const total = products.reduce(
    (sum, product) =>
      sum +
      product.quantidade *
      parsePrice(product.precoInput),
    0
  )

  const sortableIds =
    page === "market"
      ? products.map(
        product => `market-${product.id}`
      )
      : page === "comparator"
        ? comparators.map(
          product => product.id
        )
        : page === "lists"
          ? savedLists.map(
            list => `saved-${list.id}`
          )
          : recipes.map(
            recipe => `recipe-${recipe.id}`
          )

  function navigate(nextPage: Page) {
    setPage(nextPage)
    setMenuOpen(false)
    setActiveId(null)
    setRecipeScreen("list")
    setSelectedRecipeId(null)
    setDraftRecipe(null)
  }

  function addItem() {
    if (page === "market") {
      setProducts(previous => [
        {
          id: nextProductId(previous),
          nome: "",
          quantidade: 1,
          precoInput: "",
          expanded: true
        },
        ...previous.map(product => ({
          ...product,
          expanded: false
        }))
      ])

      return
    }

    if (page === "comparator") {
      const nextCount =
        comparatorCount + 1

      setComparatorCount(nextCount)

      setComparators(previous => [
        ...previous,
        {
          id: `comparator-${createId()}`,
          nome: `Prod ${nextCount}`,
          precoInput: "",
          unidadeInput: ""
        }
      ])

      return
    }

    if (
      page === "recipes" &&
      recipeScreen === "list"
    ) {
      setNewRecipeName("")
      setCreateRecipeModalOpen(true)
    }
  }

  function updateMarketProduct(
    id: number,
    changes: Partial<ProductItem>
  ) {
    setProducts(previous =>
      previous.map(product => {
        if (product.id === id) {
          return {
            ...product,
            ...changes
          }
        }

        if (changes.expanded === true) {
          return {
            ...product,
            expanded: false
          }
        }

        return product
      })
    )
  }

  function updateComparator(
    id: string,
    changes: Partial<ComparatorItem>
  ) {
    setComparators(previous =>
      previous.map(product =>
        product.id === id
          ? {
            ...product,
            ...changes
          }
          : product
      )
    )
  }

  function toggleSavedList(
    id: string
  ) {
    setExpandedSavedListIds(previous =>
      previous.includes(id)
        ? previous.filter(
          current => current !== id
        )
        : [...previous, id]
    )
  }

  function saveShoppingList() {
    const name = saveListName.trim()

    if (!name) return

    const newList: SavedShoppingList = {
      id: createId(),
      nome: name,
      createdAt: new Date().toISOString(),
      products: products.map(product => ({
        ...product,
        expanded: false
      }))
    }

    setSavedLists(previous => [
      ...previous,
      newList
    ])

    setSaveListModalOpen(false)
    setSaveListName("")
  }

  function openRecipe(
    recipeId: string
  ) {
    setSelectedRecipeId(recipeId)
    setRecipeScreen("view")
    setDraftRecipe(null)
  }

  function startNewRecipe() {
    const name = newRecipeName.trim()

    if (!name) return

    const newRecipe = createEmptyRecipe(
      name,
      createId()
    )

    setDraftRecipe(newRecipe)
    setSelectedRecipeId(newRecipe.id)
    setRecipeScreen("edit")
    setCreateRecipeModalOpen(false)
    setNewRecipeName("")
  }

  function editRecipe() {
    if (!selectedRecipe) return

    setDraftRecipe(
      structuredClone(selectedRecipe)
    )

    setRecipeScreen("edit")
  }

  function saveRecipe(
    recipe: RecipeData
  ) {
    const updatedRecipe =
      withUpdatedTimestamp(recipe)

    setRecipes(previous => {
      const exists = previous.some(
        item => item.id === updatedRecipe.id
      )

      if (exists) {
        return previous.map(item =>
          item.id === updatedRecipe.id
            ? updatedRecipe
            : item
        )
      }

      return [
        ...previous,
        updatedRecipe
      ]
    })

    setSelectedRecipeId(updatedRecipe.id)
    setDraftRecipe(null)
    setRecipeScreen("view")
  }

  function cancelRecipeEdit() {
    setDraftRecipe(null)

    if (selectedRecipe) {
      setRecipeScreen("view")
    } else {
      setRecipeScreen("list")
      setSelectedRecipeId(null)
    }
  }

  function backToRecipes() {
    setRecipeScreen("list")
    setSelectedRecipeId(null)
    setDraftRecipe(null)
  }

  function requestSavedListImport(
    list: SavedShoppingList
  ) {
    setImportRequest({
      name: list.nome,
      products: list.products,
      recipe: false
    })
  }

  function requestRecipeImport(
    recipe: RecipeData
  ) {
    const importedProducts =
      recipeToMarketProducts(
        recipe,
        1
      )

    if (importedProducts.length === 0) {
      return
    }

    setImportRequest({
      name: recipe.name,
      products: importedProducts,
      recipe: true
    })
  }

  function confirmImport(
    mode: ImportMode
  ) {
    if (!importRequest) return

    const request = importRequest

    setProducts(previous => {
      const imported =
        cloneImportedProducts(
          request.products,
          mode === "append"
            ? previous
            : []
        )

      if (mode === "replace") {
        return imported
      }

      return [
        ...previous,
        ...imported
      ]
    })

    setImportRequest(null)

    setPage("market")
    setRecipeScreen("list")
    setSelectedRecipeId(null)
    setDraftRecipe(null)
  }

  function handleDragStart(
    event: DragStartEvent
  ) {
    if (isRecipeDetail) return

    setActiveId(
      String(event.active.id)
    )
  }

  function handleDragEnd(
    event: DragEndEvent
  ) {
    const id = String(
      event.active.id
    )

    const overId = event.over
      ? String(event.over.id)
      : null

    setActiveId(null)

    if (!overId) return

    if (overId === TRASH_ID) {
      setDeleteId(id)
      return
    }

    if (id === overId) return

    if (page === "market") {
      setProducts(previous =>
        reorderItems(
          previous,
          item => `market-${item.id}`,
          id,
          overId
        )
      )
    }

    if (page === "comparator") {
      setComparators(previous =>
        reorderItems(
          previous,
          item => item.id,
          id,
          overId
        )
      )
    }

    if (page === "lists") {
      setSavedLists(previous =>
        reorderItems(
          previous,
          item => `saved-${item.id}`,
          id,
          overId
        )
      )
    }

    if (page === "recipes") {
      setRecipes(previous =>
        reorderItems(
          previous,
          item => `recipe-${item.id}`,
          id,
          overId
        )
      )
    }
  }

  function confirmDelete() {
    if (!deleteId) return

    if (
      deleteId.startsWith("market-")
    ) {
      const id = Number(
        deleteId.replace("market-", "")
      )

      setProducts(previous =>
        previous.filter(
          item => item.id !== id
        )
      )
    } else if (
      deleteId.startsWith("comparator-")
    ) {
      setComparators(previous =>
        previous.filter(
          item => item.id !== deleteId
        )
      )
    } else if (
      deleteId.startsWith("saved-")
    ) {
      const id = deleteId.replace(
        "saved-",
        ""
      )

      setSavedLists(previous =>
        previous.filter(
          item => item.id !== id
        )
      )
    } else if (
      deleteId.startsWith("recipe-")
    ) {
      const id = deleteId.replace(
        "recipe-",
        ""
      )

      setRecipes(previous =>
        previous.filter(
          item => item.id !== id
        )
      )
    }

    setDeleteId(null)
  }

  function getDeleteTitle(): string {
    if (!deleteId) return ""

    if (
      deleteId.startsWith("recipe-")
    ) {
      return "Excluir receita"
    }

    if (
      deleteId.startsWith("saved-")
    ) {
      return "Excluir lista salva"
    }

    return "Excluir produto"
  }

  const activeMarketProduct =
    activeId?.startsWith("market-")
      ? products.find(
        item =>
          `market-${item.id}` === activeId
      )
      : null

  const activeComparator =
    comparators.find(
      item => item.id === activeId
    )

  const activeSavedList =
    activeId?.startsWith("saved-")
      ? savedLists.find(
        item =>
          `saved-${item.id}` === activeId
      )
      : null

  const activeRecipe =
    activeId?.startsWith("recipe-")
      ? recipes.find(
        item =>
          `recipe-${item.id}` === activeId
      )
      : null

  const showAddButton =
    page === "market" ||
    page === "comparator" ||
    (
      page === "recipes" &&
      recipeScreen === "list"
    )

  return (
    <div className={darkMode ? "app dark" : "app"}>
      {!isRecipeDetail && (
        <header className="appHeader">
          <button
            type="button"
            className="menuButton"
            onClick={() =>
              setMenuOpen(true)
            }
            aria-label="Abrir menu"
          >
            ☰
          </button>

          <h1>
            {page === "market"
              ? "Lista Mercado"
              : page === "comparator"
                ? "Comparador de Preços"
                : page === "lists"
                  ? "Listas Salvas"
                  : "Receitas"}
          </h1>

          {showAddButton && (
            <button
              type="button"
              className="headerAddButton"
              onClick={addItem}
              aria-label="Adicionar"
            >
              +
            </button>
          )}
        </header>
      )}

      {isRecipeDetail ? (
        <main className="appContent recipePageContent">
          {recipeScreen === "view" &&
            selectedRecipe && (
              <RecipeViewer
                recipe={selectedRecipe}
                onEdit={editRecipe}
                onBack={backToRecipes}
              />
            )}

          {recipeScreen === "edit" &&
            draftRecipe && (
              <RecipeEditor
                key={draftRecipe.id}
                recipe={draftRecipe}
                onSave={saveRecipe}
                onCancel={cancelRecipeEdit}
              />
            )}
        </main>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={
            collisionDetection
          }
          onDragStart={
            handleDragStart
          }
          onDragEnd={
            handleDragEnd
          }
          onDragCancel={() =>
            setActiveId(null)
          }
        >
          <SortableContext
            items={sortableIds}
            strategy={
              verticalListSortingStrategy
            }
          >
            <main className="appContent">
              {page === "market" &&
                products.map(product => (
                  <Product
                    key={product.id}
                    product={product}
                    onChange={changes =>
                      updateMarketProduct(
                        product.id,
                        changes
                      )
                    }
                  />
                ))}

              {page === "comparator" &&
                comparators.map(product => (
                  <PriceComparator
                    key={product.id}
                    product={product}
                    onChange={changes =>
                      updateComparator(
                        product.id,
                        changes
                      )
                    }
                  />
                ))}

              {page === "lists" &&
                savedLists.map(list => (
                  <SavedList
                    key={list.id}
                    list={list}
                    expanded={
                      expandedSavedListIds.includes(
                        list.id
                      )
                    }
                    onToggle={() =>
                      toggleSavedList(list.id)
                    }
                    onImport={() =>
                      requestSavedListImport(
                        list
                      )
                    }
                  />
                ))}

              {page === "recipes" &&
                recipes.map(recipe => (
                  <Recipe
                    key={recipe.id}
                    recipe={recipe}
                    onOpen={() =>
                      openRecipe(recipe.id)
                    }
                    onImport={() =>
                      requestRecipeImport(
                        recipe
                      )
                    }
                  />
                ))}

              {page === "recipes" &&
                recipes.length === 0 && (
                  <div className="recipeEmptyList">
                    <p>
                      Nenhuma receita cadastrada.
                    </p>

                    <p>
                      Clique em + para criar
                      sua primeira receita.
                    </p>
                  </div>
                )}

              {page === "lists" &&
                savedLists.length === 0 && (
                  <div className="emptyState">
                    <p>
                      Nenhuma lista salva.
                    </p>
                  </div>
                )}
            </main>
          </SortableContext>

          <TrashZone
            visible={activeId !== null}
          />

          <DragOverlay
            dropAnimation={{
              sideEffects:
                defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: "0.3"
                    }
                  }
                })
            }}
          >
            {activeMarketProduct && (
              <div className="productCard">
                <div className="productTop">
                  <strong>
                    {activeMarketProduct.nome ||
                      "Produto"}
                  </strong>
                </div>
              </div>
            )}

            {activeComparator && (
              <div className="productCard">
                <strong>
                  {activeComparator.nome}
                </strong>
              </div>
            )}

            {activeSavedList && (
              <div className="productCard savedListCard">
                <strong>
                  {activeSavedList.nome}
                </strong>
              </div>
            )}

            {activeRecipe && (
              <div className="productCard recipeCard">
                <strong>
                  {activeRecipe.name}
                </strong>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {page === "market" &&
        !isRecipeDetail && (
          <footer className="appFooter">
            <span>Total</span>

            <strong>
              R$ {formatPrice(total)}
            </strong>
          </footer>
        )}

      <SideMenu
        open={menuOpen}
        page={page}
        darkMode={darkMode}
        onClose={() =>
          setMenuOpen(false)
        }
        onNavigate={navigate}
        onOpenSettings={() => {
          setMenuOpen(false)
          setMarketSettingsOpen(true)
        }}
        onToggleTheme={() =>
          setDarkMode(previous => !previous)
        }
      />

      {marketSettingsOpen && (
        <Modal
          title="Configurações da Lista Mercado"
          onClose={() =>
            setMarketSettingsOpen(false)
          }
        >
          <div className="settingsActions">
            <button
              type="button"
              onClick={() => {
                setMarketSettingsOpen(false)
                setSaveListName("")
                setSaveListModalOpen(true)
              }}
            >
              Salvar lista de compras
            </button>

            <button
              type="button"
              onClick={() => {
                setMarketSettingsOpen(false)
                setClearMarketConfirm(true)
              }}
            >
              Limpar lista de compras
            </button>
          </div>
        </Modal>
      )}

      {saveListModalOpen && (
        <Modal
          title="Salvar lista de compras"
          onClose={() =>
            setSaveListModalOpen(false)
          }
        >
          <form
            onSubmit={event => {
              event.preventDefault()
              saveShoppingList()
            }}
          >
            <label htmlFor="save-list-name">
              Nome da lista
            </label>

            <input
              id="save-list-name"
              type="text"
              value={saveListName}
              onChange={event =>
                setSaveListName(
                  event.target.value
                )
              }
              placeholder="Ex.: Compras do mês"
              autoFocus
            />

            <div className="confirmActions">
              <button
                type="button"
                onClick={() =>
                  setSaveListModalOpen(false)
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="confirmButton"
                disabled={
                  !saveListName.trim()
                }
              >
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {clearMarketConfirm && (
        <Modal
          title="Limpar Lista Mercado"
          onClose={() =>
            setClearMarketConfirm(false)
          }
        >
          <p>
            Deseja excluir todos os produtos
            da lista atual?
          </p>

          <div className="confirmActions">
            <button
              type="button"
              onClick={() =>
                setClearMarketConfirm(false)
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className="confirmButton"
              onClick={() => {
                setProducts([])
                setClearMarketConfirm(false)
              }}
            >
              Sim, limpar
            </button>
          </div>
        </Modal>
      )}

      {createRecipeModalOpen && (
        <Modal
          title="Nova receita"
          onClose={() =>
            setCreateRecipeModalOpen(false)
          }
        >
          <form
            onSubmit={event => {
              event.preventDefault()
              startNewRecipe()
            }}
          >
            <label htmlFor="new-recipe-name">
              Nome da receita
            </label>

            <input
              id="new-recipe-name"
              type="text"
              value={newRecipeName}
              onChange={event =>
                setNewRecipeName(
                  event.target.value
                )
              }
              placeholder="Ex.: Bolo de cenoura"
              maxLength={100}
              autoFocus
            />

            <div className="confirmActions">
              <button
                type="button"
                onClick={() =>
                  setCreateRecipeModalOpen(false)
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="confirmButton"
                disabled={
                  !newRecipeName.trim()
                }
              >
                Criar receita
              </button>
            </div>
          </form>
        </Modal>
      )}

      {importRequest && (
        <Modal
          title="Adicionar à Lista Mercado"
          onClose={() =>
            setImportRequest(null)
          }
        >
          <p>
            Deseja adicionar os produtos de{" "}
            <strong>
              {importRequest.name}
            </strong>{" "}
            à Lista Mercado?
          </p>

          {importRequest.recipe && (
            <p className="quantityNotice">
              Ingredientes com medidas diferentes
              de unidade serão adicionados com
              quantidade 1. Verifique e ajuste
              as quantidades na Lista Mercado
              quando necessário.
            </p>
          )}

          <div className="importActions">
            {products.length > 0 ? (
              <>
                <button
                  type="button"
                  className="primaryButton"
                  onClick={() =>
                    confirmImport("append")
                  }
                >
                  Adicionar à lista atual
                </button>

                <button
                  type="button"
                  className="dangerOutline"
                  onClick={() =>
                    confirmImport("replace")
                  }
                >
                  Limpar lista atual e adicionar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="primaryButton"
                onClick={() =>
                  confirmImport("replace")
                }
              >
                Adicionar produtos
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setImportRequest(null)
              }
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal
          title={getDeleteTitle()}
          onClose={() =>
            setDeleteId(null)
          }
        >
          <p>
            Deseja realmente excluir
            este item?
          </p>

          <div className="confirmActions">
            <button
              type="button"
              onClick={() =>
                setDeleteId(null)
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className="confirmButton"
              onClick={confirmDelete}
            >
              Sim, excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default App
