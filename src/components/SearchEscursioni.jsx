import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Search } from "lucide-preact";

function readQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") || "";
}

export default function SearchEscursioni({ placeholder = "Cerca tra le escursioni...", className = "" }) {
  const [value, setValue] = useState(() => readQuery());

  useEffect(() => {
    const syncFromUrl = () => setValue(readQuery());
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("escursioni:filters-sync", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("escursioni:filters-sync", syncFromUrl);
    };
  }, []);

  function updateSearch(nextValue) {
    setValue(nextValue);

    const params = new URLSearchParams(window.location.search);
    if (nextValue.trim()) params.set("q", nextValue.trim());
    else params.delete("q");
    params.delete("page");

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
    window.dispatchEvent(new CustomEvent("escursioni:filters-sync"));
  }

  return (
    <label class={`relative block ${className}`.trim()}>
      <input
        type="search"
        value={value}
        onInput={(event) => updateSearch(event.currentTarget.value)}
        placeholder={placeholder}
        class="w-full rounded-full border border-sand bg-cream px-5 py-3 pr-12 font-semibold text-forest-800 outline-none transition placeholder:text-forest-800/72 focus:border-terracotta-400"
        aria-label="Cerca tra le escursioni"
      />
      <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-forest-800">
        <Search size={18} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </label>
  );
}
