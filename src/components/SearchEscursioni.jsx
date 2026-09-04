import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { Search } from "lucide-preact";

function readQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") || "";
}

export default function SearchEscursioni({ placeholder = "Cerca tra le escursioni...", className = "" }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const syncFromUrl = () => {
      if (inputRef.current) inputRef.current.value = readQuery();
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("escursioni:filters-sync", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("escursioni:filters-sync", syncFromUrl);
    };
  }, []);

  function updateSearch(nextValue) {
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
        ref={inputRef}
        type="search"
        onInput={(event) => updateSearch(event.currentTarget.value)}
        placeholder={placeholder}
        class="w-full rounded-full border border-[#DDD7C9] bg-[#FFFDF7] px-5 py-3 pr-12 font-medium text-[#25251F] outline-none transition-colors placeholder:text-[#25251F]/70 focus:border-[#3F6B4F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none"
        aria-label="Cerca tra le escursioni"
      />
      <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-forest-800">
        <Search size={18} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </label>
  );
}
