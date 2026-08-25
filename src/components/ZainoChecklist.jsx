import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  ArrowDown,
  ArrowUp,
  Backpack,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Compass,
  Dog,
  ListChecks,
  Pencil,
  RotateCcw,
  Sandwich,
  Shirt,
  Sparkles,
  Trash2
} from "lucide-preact";

const CUSTOM_STORAGE_KEY = "popi-zaino-custom-items";
const CHECKED_STORAGE_KEY = "popi-zaino-checked-items";
const ORDER_STORAGE_KEY = "popi-zaino-item-order";
const EXTRA_CATEGORY = { id: "altro", label: "Altro" };
const UNDO_TIMEOUT = 7000;

const CATEGORY_ICONS = {
  essenziali: Backpack,
  "acqua-cibo": Sandwich,
  abbigliamento: Shirt,
  sicurezza: Compass,
  gea: Dog,
  altro: Sparkles
};

function normalizeLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return true;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function buildItemsByCategory(categories, customItems) {
  const baseCategories = categories.map((category) => {
    const defaultItems = category.items.map((item, index) => ({
      ...item,
      categoryId: category.id,
      source: "default",
      order: index
    }));

    const categoryCustomItems = customItems
      .filter((item) => item.categoryId === category.id)
      .map((item, index) => ({
        ...item,
        source: "custom",
        order: category.items.length + index
      }));

    return {
      ...category,
      items: [...defaultItems, ...categoryCustomItems]
    };
  });

  const knownCategoryIds = new Set(categories.map((category) => category.id));
  const dynamicCategories = [...new Set(customItems.map((item) => item.categoryId))]
    .filter((categoryId) => !knownCategoryIds.has(categoryId))
    .map((categoryId) => {
      const categoryItems = customItems
        .filter((item) => item.categoryId === categoryId)
        .map((item, index) => ({
          ...item,
          source: "custom",
          order: index
        }));

      return {
        id: categoryId,
        label: categoryItems[0]?.categoryLabel || EXTRA_CATEGORY.label,
        items: categoryItems
      };
    });

  return [...baseCategories, ...dynamicCategories];
}

function applyStoredOrder(items, storedOrder = []) {
  const validIds = new Set(items.map((item) => item.id));
  const orderedIds = storedOrder.filter((itemId) => validIds.has(itemId));
  const missingIds = [...items]
    .sort((left, right) => left.order - right.order)
    .map((item) => item.id)
    .filter((itemId) => !orderedIds.includes(itemId));
  const orderMap = new Map([...orderedIds, ...missingIds].map((itemId, index) => [itemId, index]));

  return items.map((item) => ({
    ...item,
    order: orderMap.get(item.id) ?? item.order
  }));
}

function getCategoryIcon(categoryId) {
  return CATEGORY_ICONS[categoryId] || ListChecks;
}

function formatMissingCount(count) {
  return `${count} ${count === 1 ? "mancante" : "mancanti"}`;
}

export default function ZainoChecklist({ categories = [] }) {
  const [customItems, setCustomItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [formError, setFormError] = useState("");
  const [editingItemId, setEditingItemId] = useState("");
  const [itemOrderByCategory, setItemOrderByCategory] = useState({});
  const [viewMode, setViewMode] = useState("remaining");
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState([]);
  const [isOrganizeMode, setIsOrganizeMode] = useState(false);
  const [recentlyCheckedItemId, setRecentlyCheckedItemId] = useState("");
  const [undoAction, setUndoAction] = useState(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [storageError, setStorageError] = useState(false);
  const inputRef = useRef(null);
  const selectableCategories = useMemo(() => [...categories, EXTRA_CATEGORY], [categories]);

  useEffect(() => {
    const storedCustomItems = readStorage(CUSTOM_STORAGE_KEY, []);
    const storedCheckedItems = readStorage(CHECKED_STORAGE_KEY, []);
    const storedItemOrder = readStorage(ORDER_STORAGE_KEY, {});

    setCustomItems(Array.isArray(storedCustomItems) ? storedCustomItems : []);
    setCheckedItems(Array.isArray(storedCheckedItems) ? storedCheckedItems : []);
    setItemOrderByCategory(
      storedItemOrder && typeof storedItemOrder === "object" && !Array.isArray(storedItemOrder)
        ? storedItemOrder
        : {}
    );
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;
    if (!writeStorage(CUSTOM_STORAGE_KEY, customItems)) setStorageError(true);
  }, [customItems, isReady]);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;
    if (!writeStorage(CHECKED_STORAGE_KEY, checkedItems)) setStorageError(true);
  }, [checkedItems, isReady]);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;
    if (!writeStorage(ORDER_STORAGE_KEY, itemOrderByCategory)) setStorageError(true);
  }, [itemOrderByCategory, isReady]);

  useEffect(() => {
    if (!undoAction || typeof window === "undefined") return;
    const timeoutId = window.setTimeout(() => setUndoAction(null), UNDO_TIMEOUT);
    return () => window.clearTimeout(timeoutId);
  }, [undoAction]);

  useEffect(() => {
    if (!isAddFormOpen) return;
    inputRef.current?.focus();
  }, [isAddFormOpen]);

  const allItemsByCategory = useMemo(
    () => buildItemsByCategory(categories, customItems),
    [categories, customItems]
  );

  const allItems = useMemo(
    () => allItemsByCategory.flatMap((category) => category.items),
    [allItemsByCategory]
  );

  const checkedItemIds = useMemo(() => {
    const validIds = new Set(allItems.map((item) => item.id));
    return checkedItems.filter((itemId) => validIds.has(itemId));
  }, [allItems, checkedItems]);

  useEffect(() => {
    if (checkedItemIds.length === checkedItems.length) return;
    setCheckedItems(checkedItemIds);
  }, [checkedItemIds, checkedItems]);

  const categoriesWithOrderedItems = useMemo(
    () =>
      allItemsByCategory.map((category) => {
        const orderedItems = applyStoredOrder(category.items, itemOrderByCategory[category.id]);

        return {
          ...category,
          items: orderedItems
        };
      }),
    [allItemsByCategory, itemOrderByCategory]
  );

  const checkedCount = checkedItemIds.length;
  const totalCount = allItems.length;
  const remainingCount = Math.max(totalCount - checkedCount, 0);
  const progressValue = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const progressText = `${checkedCount} di ${totalCount} pronti · ${formatMissingCount(remainingCount)}`;
  const visibleCategories = useMemo(
    () =>
      categoriesWithOrderedItems
        .map((category) => ({
          ...category,
          visibleItems:
            viewMode === "remaining"
              ? category.items.filter(
                  (item) =>
                    !checkedItemIds.includes(item.id) || item.id === recentlyCheckedItemId
                )
              : category.items
        }))
        .filter((category) => viewMode === "all" || category.visibleItems.length > 0),
    [categoriesWithOrderedItems, checkedItemIds, recentlyCheckedItemId, viewMode]
  );

  function toggleItem(item) {
    const willCheck = !checkedItemIds.includes(item.id);

    setCheckedItems((current) =>
      willCheck ? [...current, item.id] : current.filter((entry) => entry !== item.id)
    );
    setRecentlyCheckedItemId(willCheck ? item.id : "");
    setLiveMessage(`${item.label}: ${willCheck ? "pronto" : "da prendere"}.`);
  }

  function changeViewMode(nextViewMode) {
    setViewMode(nextViewMode);
    setRecentlyCheckedItemId("");
    if (nextViewMode === "remaining") setIsOrganizeMode(false);
  }

  function toggleCategory(categoryId) {
    setCollapsedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((entry) => entry !== categoryId)
        : [...current, categoryId]
    );
  }

  function toggleOrganizeMode() {
    setIsOrganizeMode((current) => {
      const nextValue = !current;
      if (nextValue) {
        setViewMode("all");
        setRecentlyCheckedItemId("");
      }
      return nextValue;
    });
  }

  function handleOpenAddForm() {
    setIsAddFormOpen(true);
    setIsOrganizeMode(false);
    setEditingItemId("");
    setNewItemLabel("");
    setSelectedCategoryId(categories[0]?.id || "");
    setFormError("");
  }

  function handleAddItem(event) {
    event.preventDefault();

    const trimmedLabel = newItemLabel.trim();
    const normalizedLabel = normalizeLabel(trimmedLabel);

    if (!trimmedLabel) {
      setFormError("Scrivi il nome dell'elemento da aggiungere.");
      return;
    }

    if (!selectedCategoryId) {
      setFormError("Scegli una categoria per il nuovo elemento.");
      return;
    }

    if (allItems.some((item) => item.id !== editingItemId && normalizeLabel(item.label) === normalizedLabel)) {
      setFormError("Questo elemento è già presente nella checklist.");
      return;
    }

    if (editingItemId) {
      const itemToEdit = customItems.find((item) => item.id === editingItemId);
      if (!itemToEdit) return;

      setCustomItems((current) =>
        current.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                label: trimmedLabel,
                categoryId: selectedCategoryId,
                categoryLabel:
                  selectableCategories.find((category) => category.id === selectedCategoryId)?.label ||
                  EXTRA_CATEGORY.label
              }
            : item
        )
      );

      if (itemToEdit.categoryId !== selectedCategoryId) {
        setItemOrderByCategory((current) => ({
          ...current,
          [itemToEdit.categoryId]: (current[itemToEdit.categoryId] || []).filter(
            (itemId) => itemId !== editingItemId
          ),
          [selectedCategoryId]: [...(current[selectedCategoryId] || []), editingItemId]
        }));
      }

      setEditingItemId("");
      setNewItemLabel("");
      setFormError("");
      setIsAddFormOpen(false);
      setLiveMessage(`${trimmedLabel} aggiornato.`);
      return;
    }

    const nextItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: trimmedLabel,
      categoryId: selectedCategoryId,
      categoryLabel:
        selectableCategories.find((category) => category.id === selectedCategoryId)?.label ||
        EXTRA_CATEGORY.label
    };

    setCustomItems((current) => [...current, nextItem]);
    setItemOrderByCategory((current) => ({
      ...current,
      [selectedCategoryId]: [...(current[selectedCategoryId] || []), nextItem.id]
    }));
    setNewItemLabel("");
    setFormError("");
    setIsAddFormOpen(false);
    setLiveMessage(`${trimmedLabel} aggiunto alla checklist.`);
  }

  function handleResetChecked() {
    if (checkedItemIds.length === 0) return;
    setUndoAction({ type: "reset", checkedItemIds: [...checkedItemIds] });
    setCheckedItems([]);
    setRecentlyCheckedItemId("");
    setLiveMessage(`${checkedItemIds.length} spunte rimosse.`);
  }

  function deleteCustomItem(itemId) {
    const item = customItems.find((entry) => entry.id === itemId);
    if (!item) return;

    const customIndex = customItems.findIndex((entry) => entry.id === itemId);
    setUndoAction({
      type: "delete",
      item,
      customIndex,
      wasChecked: checkedItemIds.includes(itemId),
      previousOrder: [...(itemOrderByCategory[item.categoryId] || [])]
    });
    setCustomItems((current) => current.filter((item) => item.id !== itemId));
    setCheckedItems((current) => current.filter((entry) => entry !== itemId));
    setItemOrderByCategory((current) =>
      Object.fromEntries(
        Object.entries(current).map(([categoryId, itemIds]) => [
          categoryId,
          itemIds.filter((entry) => entry !== itemId)
        ])
      )
    );
    if (editingItemId === itemId) {
      setEditingItemId("");
      setIsAddFormOpen(false);
    }
    setLiveMessage(`${item.label} eliminato.`);
  }

  function editCustomItem(item) {
    setEditingItemId(item.id);
    setNewItemLabel(item.label);
    setSelectedCategoryId(item.categoryId);
    setFormError("");
    setIsAddFormOpen(true);
  }

  function moveCategoryItem(category, item, direction) {
    const orderedIds = category.items.map((item) => item.id);
    const currentIndex = orderedIds.indexOf(item.id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedIds.length) return;

    const nextOrder = [...orderedIds];
    [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];

    setItemOrderByCategory((current) => ({
      ...current,
      [category.id]: nextOrder
    }));
    setLiveMessage(`${item.label} spostato ${direction < 0 ? "su" : "giù"}.`);
  }

  function handleUndo() {
    if (!undoAction) return;

    if (undoAction.type === "reset") {
      setCheckedItems((current) => [
        ...new Set([...undoAction.checkedItemIds, ...current])
      ]);
    }

    if (undoAction.type === "delete") {
      setCustomItems((current) => {
        if (current.some((item) => item.id === undoAction.item.id)) return current;
        const nextItems = [...current];
        nextItems.splice(Math.min(undoAction.customIndex, nextItems.length), 0, undoAction.item);
        return nextItems;
      });
      if (undoAction.wasChecked) {
        setCheckedItems((current) => [...new Set([...current, undoAction.item.id])]);
      }
      setItemOrderByCategory((current) => ({
        ...current,
        [undoAction.item.categoryId]: undoAction.previousOrder
      }));
    }

    setLiveMessage("Azione annullata.");
    setUndoAction(null);
  }

  return (
    <section class="mx-auto w-full max-w-3xl" aria-labelledby="zaino-checklist-title">
      <p class="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>

      <header class="border-b border-[#DDD7C9] pb-5">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h1
              id="zaino-checklist-title"
              class="text-3xl font-black tracking-[-0.025em] text-forest-800 sm:text-4xl"
            >
              Prepara lo zaino
            </h1>
            <p class="mt-1 text-sm font-semibold text-forest-700 sm:text-base">
              Nuova avventura in arrivo.
            </p>
          </div>

          {remainingCount === 0 && totalCount > 0 && (
            <CheckCircle2
              size={30}
              strokeWidth={2.2}
              class="mt-1 shrink-0 text-forest-700"
              aria-hidden="true"
            />
          )}
        </div>

        <div class="mt-4">
          <div class="flex items-baseline justify-between gap-3 text-sm font-bold text-forest-800">
            <p id="zaino-progress-text" class="min-w-0">
              {progressText}
            </p>
            <span class="shrink-0 tabular-nums text-forest-700">{progressValue}%</span>
          </div>
          <div
            class="mt-2 h-2 overflow-hidden rounded-full bg-[#e2dacb]"
            role="progressbar"
            aria-label="Progresso preparazione zaino"
            aria-describedby="zaino-progress-text"
            aria-valuemin="0"
            aria-valuemax={totalCount}
            aria-valuenow={checkedCount}
          >
            <div
              class="h-full rounded-full bg-forest-700 transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>

        {remainingCount === 0 && totalCount > 0 && (
          <p class="mt-3 flex items-center gap-2 text-sm font-extrabold text-forest-800">
            <CheckCircle2 size={18} strokeWidth={2.4} aria-hidden="true" />
            Zaino pronto. Si parte!
          </p>
        )}

        {storageError && (
          <p class="mt-3 text-sm font-semibold text-terracotta-700" role="status">
            Il browser non può salvare le modifiche: resteranno attive solo in questa scheda.
          </p>
        )}

        <div class="mt-4 flex flex-col gap-3 border-t border-[#DDD7C9] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            class="inline-grid grid-cols-2 rounded-[10px] border border-[#DDD7C9] bg-[#FFFDF7] p-1"
            role="group"
            aria-label="Vista checklist"
          >
            <button
              type="button"
              aria-pressed={viewMode === "remaining"}
              onClick={() => changeViewMode("remaining")}
              class={`min-h-11 rounded-[8px] px-3 py-2 text-sm font-extrabold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none ${
                viewMode === "remaining"
                  ? "bg-forest-700 text-[#FFFDF7]"
                  : "text-forest-800 hover:bg-cream"
              }`}
            >
              Da prendere
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "all"}
              onClick={() => changeViewMode("all")}
              class={`min-h-11 rounded-[8px] px-3 py-2 text-sm font-extrabold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none ${
                viewMode === "all"
                  ? "bg-forest-700 text-[#FFFDF7]"
                  : "text-forest-800 hover:bg-cream"
              }`}
            >
              Tutto
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddForm}
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#DDD7C9] bg-[#FFFDF7] px-3 py-2 text-sm font-extrabold text-forest-800 transition-colors hover:border-forest-300 hover:bg-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none"
            >
              <CirclePlus size={18} strokeWidth={2.2} aria-hidden="true" />
              Aggiungi
            </button>
            <button
              type="button"
              aria-pressed={isOrganizeMode}
              onClick={toggleOrganizeMode}
              class={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-sm font-extrabold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none ${
                isOrganizeMode
                  ? "border-forest-700 bg-forest-700 text-[#FFFDF7]"
                  : "border-[#DDD7C9] bg-[#FFFDF7] text-forest-800 hover:border-forest-300 hover:bg-white"
              }`}
            >
              <ListChecks size={18} strokeWidth={2.2} aria-hidden="true" />
              {isOrganizeMode ? "Fine" : "Riordina"}
            </button>
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={handleResetChecked}
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-sm font-extrabold text-terracotta-700 transition-colors hover:bg-terracotta-50 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-terracotta-600 motion-reduce:transition-none"
              >
                <RotateCcw size={17} strokeWidth={2.2} aria-hidden="true" />
                Azzera spunte
              </button>
            )}
          </div>
        </div>

        {isOrganizeMode && (
          <p class="mt-3 text-sm font-semibold text-forest-700" role="status">
            Usa le frecce per cambiare l’ordine. La vista completa resta attiva finché riordini.
          </p>
        )}
      </header>

      {isAddFormOpen && (
        <section class="border-b border-[#DDD7C9] py-5" aria-labelledby="zaino-form-title">
          <h2 id="zaino-form-title" class="text-xl font-black text-forest-800">
            {editingItemId ? "Modifica elemento" : "Aggiungi elemento"}
          </h2>
          <form class="mt-4 grid gap-4" noValidate onSubmit={handleAddItem}>
            <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_13rem]">
              <label class="grid gap-2">
                <span class="text-sm font-bold text-forest-800">Nome elemento</span>
                <input
                  ref={inputRef}
                  type="text"
                  required
                  maxLength={80}
                  value={newItemLabel}
                  aria-invalid={formError ? "true" : undefined}
                  aria-describedby={formError ? "zaino-form-error" : undefined}
                  onInput={(event) => {
                    setNewItemLabel(event.currentTarget.value);
                    if (formError) setFormError("");
                  }}
                  placeholder="Es. Felpa leggera"
                  class="w-full rounded-[10px] border border-[#c9bba9] bg-[#FFFDF7] px-3 py-3 text-base text-forest-800 outline-none transition-colors placeholder:text-forest-700 focus-visible:border-forest-700 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none"
                />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-bold text-forest-800">Categoria</span>
                <select
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.currentTarget.value)}
                  class="w-full rounded-[10px] border border-[#c9bba9] bg-[#FFFDF7] px-3 py-3 text-base text-forest-800 outline-none transition-colors focus-visible:border-forest-700 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none"
                >
                  {selectableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {formError && (
              <p id="zaino-form-error" class="text-sm font-semibold text-terracotta-700" role="alert">
                {formError}
              </p>
            )}

            <div class="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                class="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-forest-700 px-4 py-2.5 text-sm font-extrabold text-[#FFFDF7] transition-colors hover:bg-forest-600 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none"
              >
                Salva elemento
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddFormOpen(false);
                  setFormError("");
                  setNewItemLabel("");
                  setEditingItemId("");
                }}
                class="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#DDD7C9] bg-[#FFFDF7] px-4 py-2.5 text-sm font-extrabold text-forest-800 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none"
              >
                Annulla
              </button>
            </div>
          </form>
        </section>
      )}

      <div class="divide-y divide-[#DDD7C9]">
        {visibleCategories.map((category) => {
          const CategoryIcon = getCategoryIcon(category.id);
          const missingCount = category.items.filter(
            (item) => !checkedItemIds.includes(item.id)
          ).length;
          const completedCount = category.items.length - missingCount;
          const isCollapsed = collapsedCategoryIds.includes(category.id);

          return (
            <section key={category.id} aria-labelledby={`category-${category.id}`} class="py-4 sm:py-5">
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={`category-items-${category.id}`}
                onClick={() => toggleCategory(category.id)}
                class="flex min-h-11 w-full items-center gap-3 rounded-[10px] text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700"
              >
                <CategoryIcon
                  size={21}
                  strokeWidth={2.1}
                  class="shrink-0 text-terracotta-700"
                  aria-hidden="true"
                />
                <span id={`category-${category.id}`} class="min-w-0 flex-1 text-xl font-black text-forest-800">
                  {category.label}
                </span>
                <span
                  class={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums ${
                    missingCount === 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#FFFDF7] text-forest-700"
                  }`}
                >
                  {missingCount === 0
                    ? "Pronto"
                    : viewMode === "remaining"
                      ? formatMissingCount(missingCount)
                      : `${completedCount}/${category.items.length} pronti`}
                </span>
                <ChevronDown
                  size={19}
                  strokeWidth={2.2}
                  class={`shrink-0 text-forest-700 transition-transform duration-200 motion-reduce:transition-none ${
                    isCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                  aria-hidden="true"
                />
              </button>

              <ul
                id={`category-items-${category.id}`}
                hidden={isCollapsed}
                class="mt-1 divide-y divide-[#DDD7C9]/80"
                role="list"
              >
                  {category.visibleItems.map((item) => {
                    const itemIndex = category.items.findIndex((entry) => entry.id === item.id);
                    const isChecked = checkedItemIds.includes(item.id);

                    return (
                      <li key={item.id}>
                        <div class="flex min-h-12 items-center gap-1">
                          <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2.5 pr-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleItem(item)}
                              class="h-5 w-5 shrink-0 accent-[#315334] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700"
                            />

                            <span class="min-w-0 flex-1 break-words [overflow-wrap:anywhere] text-base font-semibold leading-6 text-forest-800">
                              <span
                                class={
                                  isChecked
                                    ? "text-forest-700 line-through decoration-[1.5px]"
                                    : undefined
                                }
                              >
                                {item.label}
                              </span>
                              {item.source === "custom" && (
                                <span class="ml-2 inline-flex rounded-full bg-[#FFFDF7] px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.08em] text-terracotta-700">
                                  Extra
                                </span>
                              )}
                              {isChecked && viewMode === "remaining" && (
                                <span class="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                                  Pronto
                                </span>
                              )}
                            </span>
                          </label>

                          {isOrganizeMode ? (
                            <div class="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                disabled={itemIndex === 0}
                                onClick={() => moveCategoryItem(category, item, -1)}
                                aria-label={`Sposta ${item.label} su`}
                                class="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-forest-700 transition-colors hover:bg-[#FFFDF7] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
                              >
                                <ArrowUp size={18} strokeWidth={2.2} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                disabled={itemIndex === category.items.length - 1}
                                onClick={() => moveCategoryItem(category, item, 1)}
                                aria-label={`Sposta ${item.label} giù`}
                                class="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-forest-700 transition-colors hover:bg-[#FFFDF7] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
                              >
                                <ArrowDown size={18} strokeWidth={2.2} aria-hidden="true" />
                              </button>
                            </div>
                          ) : (
                            item.source === "custom" && (
                              <div class="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => editCustomItem(item)}
                                  aria-label={`Modifica ${item.label}`}
                                  class="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-forest-700 transition-colors hover:bg-[#FFFDF7] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none"
                                >
                                  <Pencil size={17} strokeWidth={2.1} aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteCustomItem(item.id)}
                                  aria-label={`Elimina ${item.label}`}
                                  class="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-terracotta-700 transition-colors hover:bg-terracotta-50 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-terracotta-600 motion-reduce:transition-none"
                                >
                                  <Trash2 size={18} strokeWidth={2.1} aria-hidden="true" />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>
          );
        })}
      </div>

      {viewMode === "remaining" && remainingCount === 0 && totalCount > 0 && (
        <div class="border-t border-[#DDD7C9] py-8 text-center">
          <button
            type="button"
            onClick={() => changeViewMode("all")}
            class="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#DDD7C9] bg-[#FFFDF7] px-4 py-2.5 text-sm font-extrabold text-forest-800 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700 motion-reduce:transition-none"
          >
            Vedi checklist completa
          </button>
        </div>
      )}

      {totalCount === 0 && (
        <div class="py-10 text-center">
          <p class="text-base font-bold text-forest-800">La checklist è vuota.</p>
          <button
            type="button"
            onClick={handleOpenAddForm}
            class="mt-3 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-forest-700 px-4 py-2.5 text-sm font-extrabold text-[#FFFDF7] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest-700"
          >
            Aggiungi il primo elemento
          </button>
        </div>
      )}

      {undoAction && (
        <div
          class="fixed inset-x-4 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-[1200] mx-auto flex max-w-sm items-center justify-between gap-4 rounded-[14px] bg-forest-800 px-4 py-3 text-[#FFFDF7] shadow-[0_8px_24px_rgba(37,37,31,0.16)] md:inset-x-auto md:bottom-6 md:right-6 md:mx-0"
          role="status"
          aria-live="polite"
        >
          <span class="text-sm font-bold">
            {undoAction.type === "reset" ? "Spunte azzerate." : `${undoAction.item.label} eliminato.`}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            class="min-h-11 shrink-0 rounded-[10px] px-3 py-2 text-sm font-black text-[#FFFDF7] underline decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FFFDF7]"
          >
            Annulla
          </button>
        </div>
      )}
    </section>
  );
}
