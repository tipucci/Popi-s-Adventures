import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { CirclePlus, RotateCcw } from "lucide-preact";

const CUSTOM_STORAGE_KEY = "popi-zaino-custom-items";
const CHECKED_STORAGE_KEY = "popi-zaino-checked-items";
const EXTRA_CATEGORY = { id: "altro", label: "Altro" };

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

function sortCategoryItems(items, checkedItems) {
  return [...items].sort((left, right) => {
    const leftChecked = checkedItems.includes(left.id);
    const rightChecked = checkedItems.includes(right.id);

    if (leftChecked !== rightChecked) return leftChecked ? 1 : -1;
    return left.order - right.order;
  });
}

function getCategoryEmoji(categoryId) {
  const emojiMap = {
    essenziali: "🎒",
    "acqua-cibo": "🥪",
    abbigliamento: "🧥",
    sicurezza: "🧭",
    gea: "🐶",
    altro: "✨"
  };

  return emojiMap[categoryId] || "•";
}

export default function ZainoChecklist({ categories = [] }) {
  const [customItems, setCustomItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [formError, setFormError] = useState("");
  const inputRef = useRef(null);
  const selectableCategories = useMemo(() => [...categories, EXTRA_CATEGORY], [categories]);

  useEffect(() => {
    const storedCustomItems = readStorage(CUSTOM_STORAGE_KEY, []);
    const storedCheckedItems = readStorage(CHECKED_STORAGE_KEY, []);

    setCustomItems(Array.isArray(storedCustomItems) ? storedCustomItems : []);
    setCheckedItems(Array.isArray(storedCheckedItems) ? storedCheckedItems : []);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;
    window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customItems));
  }, [customItems, isReady]);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;
    window.localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(checkedItems));
  }, [checkedItems, isReady]);

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

  const normalizedItemNames = useMemo(
    () => new Set(allItems.map((item) => normalizeLabel(item.label))),
    [allItems]
  );

  const checkedItemIds = useMemo(() => {
    const validIds = new Set(allItems.map((item) => item.id));
    return checkedItems.filter((itemId) => validIds.has(itemId));
  }, [allItems, checkedItems]);

  useEffect(() => {
    if (checkedItemIds.length === checkedItems.length) return;
    setCheckedItems(checkedItemIds);
  }, [checkedItemIds, checkedItems]);

  const categoriesWithSortedItems = useMemo(
    () =>
      allItemsByCategory.map((category) => ({
        ...category,
        items: sortCategoryItems(category.items, checkedItemIds)
      })),
    [allItemsByCategory, checkedItemIds]
  );

  const checkedCount = checkedItemIds.length;
  const totalCount = allItems.length;
  const remainingCount = Math.max(totalCount - checkedCount, 0);
  const progressValue = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  function toggleItem(itemId) {
    setCheckedItems((current) =>
      current.includes(itemId)
        ? current.filter((entry) => entry !== itemId)
        : [...current, itemId]
    );
  }

  function handleOpenAddForm() {
    setIsAddFormOpen(true);
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

    if (normalizedItemNames.has(normalizedLabel)) {
      setFormError("Questo elemento è già presente nella checklist.");
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
    setNewItemLabel("");
    setFormError("");
    setIsAddFormOpen(false);
  }

  function handleResetChecked() {
    setCheckedItems([]);
  }

  return (
    <section class="space-y-5" aria-labelledby="zaino-checklist-title">
      <header class="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-card sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-terracotta-600">
              Prepara lo zaino
            </p>
            <h1 id="zaino-checklist-title" class="mt-2 text-3xl font-black text-forest-800">
              Nuova avventura in arrivo
            </h1>
          </div>

          <span class="hidden rounded-full bg-terracotta-50 px-4 py-2 text-sm font-bold text-terracotta-700 sm:inline-flex">
            {remainingCount} da prendere
          </span>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div class="rounded-[1.5rem] bg-cream px-4 py-4">
            <div class="flex items-center gap-3">
              <p class="whitespace-nowrap text-sm font-bold text-forest-800">
                {checkedCount} di {totalCount} pronti
              </p>
            </div>

            <div
              class="mt-3 h-3 overflow-hidden rounded-full bg-[#e9ddcd]"
              role="progressbar"
              aria-label="Progresso preparazione zaino"
              aria-valuemin="0"
              aria-valuemax={totalCount}
              aria-valuenow={checkedCount}
            >
              <div
                class="h-full rounded-full bg-forest-700 transition-[width] duration-300"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetChecked}
            class="inline-flex items-center justify-center gap-2 rounded-full border border-terracotta-200 bg-white px-4 py-3 text-sm font-bold text-forest-800 transition hover:border-terracotta-300 hover:bg-terracotta-50"
          >
            <RotateCcw size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>Nuovo zaino</span>
          </button>
        </div>
      </header>

      <div class="grid gap-4">
        {categoriesWithSortedItems.map((category) => (
          <section
            key={category.id}
            aria-labelledby={`category-${category.id}`}
            class="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-card sm:p-6"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 id={`category-${category.id}`} class="mt-1 text-2xl font-black text-forest-800">
                  <span aria-hidden="true" class="mr-2">
                    {getCategoryEmoji(category.id)}
                  </span>
                  {category.label}
                </h2>
              </div>

              {category.items.filter((item) => !checkedItemIds.includes(item.id)).length === 0 ? (
                <span class="rounded-full bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
                  Pronto
                </span>
              ) : (
                <span class="rounded-full bg-cream px-3 py-2 text-sm font-bold text-forest-700">
                  {category.items.filter((item) => !checkedItemIds.includes(item.id)).length} mancanti
                </span>
              )}
            </div>

            <ul class="mt-4 grid gap-3" role="list">
              {category.items.map((item) => {
                const isChecked = checkedItemIds.includes(item.id);

                return (
                  <li key={item.id}>
                    <label
                      class={`flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 transition ${
                        isChecked
                          ? "border-[#e8d9c8] bg-[#fcf7f0] text-forest-700/70"
                          : "border-transparent bg-cream text-forest-800 shadow-[inset_0_0_0_1px_rgba(95,44,29,0.06)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(item.id)}
                        class="h-5 w-5 shrink-0 accent-[#315334]"
                      />

                      <span class="min-w-0 flex-1 text-base font-semibold leading-6">
                        <span class={isChecked ? "line-through decoration-[1.5px]" : ""}>
                          {item.label}
                        </span>
                        {item.source === "custom" && (
                          <span class="ml-2 inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-bold uppercase tracking-[0.12em] text-terracotta-600">
                            Extra
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section class="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-card sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-black text-forest-800">Dimenticato qualcosa?</h2>
            <p class="mt-1 text-sm text-forest-700">Aggiungi altri elementi alla lista.</p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddForm}
            class="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta-500 px-4 py-3 text-sm font-bold text-[#fffaf3] transition hover:bg-terracotta-600"
          >
            <CirclePlus size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>Aggiungi elemento</span>
          </button>
        </div>

        {isAddFormOpen && (
          <form class="mt-4 grid gap-3 rounded-[1.5rem] bg-cream p-4" onSubmit={handleAddItem}>
            <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <label class="grid gap-2">
                <span class="text-sm font-bold text-forest-800">Nome elemento</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={newItemLabel}
                  onInput={(event) => {
                    setNewItemLabel(event.currentTarget.value);
                    if (formError) setFormError("");
                  }}
                  placeholder="Es. Felpa leggera"
                  class="w-full rounded-[1rem] border border-[#d8c5ae] bg-white px-4 py-3 text-base text-forest-800 outline-none transition placeholder:text-forest-700/60 focus:border-terracotta-400"
                />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-bold text-forest-800">Categoria</span>
                <select
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.currentTarget.value)}
                  class="w-full rounded-[1rem] border border-[#d8c5ae] bg-white px-4 py-3 text-base text-forest-800 outline-none transition focus:border-terracotta-400"
                >
                  {selectableCategories.map((category) => (
                    <option value={category.id}>{category.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {formError && (
              <p class="text-sm font-semibold text-terracotta-700" role="alert">
                {formError}
              </p>
            )}

            <div class="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                class="inline-flex items-center justify-center rounded-full bg-forest-700 px-4 py-3 text-sm font-bold text-[#fffaf3] transition hover:bg-forest-600"
              >
                Salva elemento
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddFormOpen(false);
                  setFormError("");
                  setNewItemLabel("");
                }}
                class="inline-flex items-center justify-center rounded-full border border-forest-200 px-4 py-3 text-sm font-bold text-forest-800 transition hover:bg-white"
              >
                Annulla
              </button>
            </div>
          </form>
        )}
      </section>
    </section>
  );
}
