import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { SquarePen, X } from "lucide-preact";

type PreviewImage = {
  id: string;
  fileName: string;
  url: string;
};

type UploadState = "idle" | "selected" | "compressing" | "uploading" | "success" | "error";

type UploadResponse = {
  success?: boolean;
  createdFiles?: string[];
  message?: string;
};

type UploadTarget = "gallery" | "cover";

const MAX_GALLERY_FILES = 12;
const MAX_LONG_EDGE = 2000;
const JPEG_QUALITY = 0.78;

function formatErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Qualcosa e' andato storto durante l'upload.";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error(`Impossibile leggere ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Una delle immagini selezionate non puo' essere elaborata."));
    image.src = dataUrl;
  });
}

async function compressImage(file: File) {
  const inputDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(inputDataUrl);

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const longestSide = Math.max(width, height) || 1;
  const scale = Math.min(1, MAX_LONG_EDGE / longestSide);
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Il browser non supporta la compressione delle immagini.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const outputDataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  if (!outputDataUrl.startsWith("data:image/jpeg;base64,")) {
    throw new Error("Compressione immagine non riuscita.");
  }

  return outputDataUrl;
}

function getStatusLabel(state: UploadState) {
  switch (state) {
    case "selected":
      return "Immagini selezionate";
    case "compressing":
      return "Compressione in corso";
    case "uploading":
      return "Upload in corso";
    case "success":
      return "Upload completato";
    case "error":
      return "Errore";
    default:
      return "";
  }
}

export default function PhotoUploadButton({
  slug,
  apiUrl,
  target = "gallery",
  buttonClassName = "",
  iconOnly = false
}: {
  slug: string;
  apiUrl: string;
  target?: UploadTarget;
  buttonClassName?: string;
  iconOnly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);
  const [busyLabel, setBusyLabel] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewsRef = useRef<PreviewImage[]>([]);
  const maxFiles = target === "cover" ? 1 : MAX_GALLERY_FILES;
  const isCoverUpload = target === "cover";
  const title = isCoverUpload ? "Aggiorna l'immagine di copertina" : "Aggiungi immagini a questa escursione";
  const buttonLabel = isCoverUpload ? "Modifica cover" : "Aggiungi foto";
  const confirmLabel = isCoverUpload ? "Salva cover" : "Conferma";
  const dialogId = `photo-upload-${target}-${slug.replace(/[^a-z0-9-]/gi, "-")}`;
  const dialogTitleId = `${dialogId}-title`;
  const isBusy = status === "compressing" || status === "uploading";
  const busyRef = useRef(isBusy);
  busyRef.current = isBusy;

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
      document.body.classList.remove("upload-modal-open");
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current;
    const focusableSelector = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])'
    ].join(",");

    const focusPassword = window.requestAnimationFrame(() => passwordInputRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (busyRef.current) return;
        event.preventDefault();
        closePanel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusPassword);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen]);

  const canSubmit = password.trim().length > 0 && selectedFiles.length > 0 && !isBusy;
  const statusLabel = useMemo(() => getStatusLabel(status), [status]);

  function updateSelection(nextFiles: File[], nextStatus: UploadState = nextFiles.length > 0 ? "selected" : "idle") {
    setPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));
      return nextFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        fileName: file.name,
        url: URL.createObjectURL(file)
      }));
    });
    setSelectedFiles(nextFiles);
    setStatus(nextStatus);
    setBusyLabel("");
  }

  function closePanel() {
    if (isBusy) return;
    document.body.classList.remove("upload-modal-open");
    setIsOpen(false);
    setPassword("");
    updateSelection([]);
    setMessage("");
    setCreatedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFilesChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const nextFiles = Array.from(input.files || []);

    if (nextFiles.length > maxFiles) {
      setStatus("error");
      setMessage(`Puoi caricare al massimo ${maxFiles} ${maxFiles === 1 ? "immagine" : "immagini"} per volta.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const invalidFile = nextFiles.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      setStatus("error");
      setMessage("Seleziona solo file immagine.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    updateSelection(nextFiles);
    setMessage("");
    setCreatedFiles([]);
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setStatus("compressing");
      setMessage("");
      setBusyLabel(`Compressione di ${selectedFiles.length} immagini...`);

      const compressedImages: string[] = [];
      for (let index = 0; index < selectedFiles.length; index += 1) {
        setBusyLabel(`Compressione ${index + 1} di ${selectedFiles.length}...`);
        compressedImages.push(await compressImage(selectedFiles[index]));
      }

      setStatus("uploading");
      setBusyLabel(`Upload di ${compressedImages.length} immagini...`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password,
          slug,
          target,
          images: compressedImages
        })
      });

      const data = (await response.json().catch(() => ({}))) as UploadResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Upload non riuscito.");
      }

      setStatus("success");
      setMessage(data.message || "Foto aggiunte con successo.");
      setCreatedFiles(Array.isArray(data.createdFiles) ? data.createdFiles : []);
      setPassword("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      updateSelection([], "success");
    } catch (error) {
      setStatus("error");
      setMessage(formatErrorMessage(error));
    } finally {
      setBusyLabel("");
    }
  }

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        class={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#DDD7C9] bg-[#FFFDF7] px-4 py-2.5 text-sm font-bold leading-none text-[#3F6B4F] transition-colors hover:bg-[#F7F1E3] hover:text-[#25251F] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] focus:ring-offset-2 focus:ring-offset-[#F7F1E3] motion-reduce:transition-none [&_svg]:block [&_svg]:shrink-0 ${buttonClassName}`.trim()}
        onClick={() => {
          document.body.classList.add("upload-modal-open");
          setIsOpen(true);
        }}
        aria-label={buttonLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
      >
        <SquarePen size={18} strokeWidth={2.2} color="currentColor" aria-hidden="true" />
        {!iconOnly && <span>{buttonLabel}</span>}
      </button>

      {isOpen && (
        <div
          class="fixed inset-0 z-[1300] flex items-end justify-center bg-[#25251F]/68 px-4 pb-4 pt-6 sm:items-center sm:py-8"
          onClick={(event) => {
            if (event.currentTarget === event.target && !busyRef.current) closePanel();
          }}
        >
          <div
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            class="max-h-[calc(100vh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[14px] bg-[#FFFDF7] shadow-[0_8px_24px_rgba(37,37,31,0.16)]"
          >
            <div class="flex items-start justify-between gap-4 border-b border-[#DDD7C9] px-5 py-4">
              <h2 id={dialogTitleId} class="m-0 text-2xl font-bold leading-tight text-[#25251F]">{title}</h2>
              <button
                type="button"
                onClick={closePanel}
                disabled={isBusy}
                aria-label="Chiudi caricamento foto"
                class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-[#3F6B4F] transition-colors hover:bg-[#F7F1E3] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            <form class="space-y-4 px-5 py-5" onSubmit={handleSubmit}>
              <label class="block space-y-2">
                <span class="text-sm font-bold text-forest-800">Password</span>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onInput={(event) => setPassword((event.currentTarget as HTMLInputElement).value)}
                  class="w-full rounded-[10px] border border-[#DDD7C9] bg-white px-4 py-3 text-base text-[#25251F] outline-none transition-colors placeholder:text-[#25251F]/55 focus:border-[#3F6B4F] focus:ring-2 focus:ring-[#3F6B4F]/20"
                  placeholder="Inserisci la password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <label class="block space-y-2">
                <span class="text-sm font-bold text-forest-800">Foto</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple={!isCoverUpload}
                  onChange={handleFilesChange}
                  class="block w-full rounded-[10px] border border-dashed border-[#DDD7C9] bg-white px-4 py-3 text-sm text-[#3F6B4F] file:mr-3 file:rounded-[6px] file:border-0 file:bg-[#F7F1E3] file:px-4 file:py-2 file:font-bold file:text-[#3F6B4F]"
                  required
                />
              </label>

              {previews.length > 0 && (
                <div class="grid grid-cols-3 gap-2 rounded-[10px] bg-[#F7F1E3] p-2">
                  {previews.map((preview) => (
                    <figure key={preview.id} class="overflow-hidden rounded-[6px] bg-white">
                      <img src={preview.url} alt={preview.fileName} class="aspect-square h-full w-full object-cover" />
                    </figure>
                  ))}
                </div>
              )}

              {(statusLabel || message || busyLabel) && (
                <div
                  role={status === "error" ? "alert" : "status"}
                  aria-live={status === "error" ? "assertive" : "polite"}
                  class={`rounded-[10px] px-4 py-3 text-sm ${
                    status === "error"
                      ? "bg-[#fff1eb] text-[#8a3e24]"
                      : status === "success"
                        ? "bg-[#edf6ee] text-[#295033]"
                        : "bg-cream text-forest-700"
                  }`}
                >
                  {statusLabel && <p class="font-bold">{statusLabel}</p>}
                  {busyLabel && <p class="mt-1">{busyLabel}</p>}
                  {message && <p class={statusLabel || busyLabel ? "mt-1" : ""}>{message}</p>}
                  {createdFiles.length > 0 && (
                    <p class="mt-1 break-words text-xs">
                      {createdFiles.join(", ")}
                    </p>
                  )}
                </div>
              )}

              <div class="sticky bottom-0 -mx-5 flex gap-3 border-t border-[#DDD7C9] bg-[#FFFDF7] px-5 pb-1 pt-4">
                <button
                  type="button"
                  onClick={closePanel}
                  disabled={isBusy}
                  class="inline-flex min-h-12 flex-1 items-center justify-center rounded-[10px] border border-[#DDD7C9] bg-white px-4 py-3 text-sm font-bold text-[#3F6B4F] transition-colors hover:bg-[#F7F1E3] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Chiudi
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  class="inline-flex min-h-12 flex-1 items-center justify-center rounded-[10px] bg-[#3F6B4F] px-4 py-3 text-sm font-bold text-[#FFFDF7] transition-colors hover:bg-[#25251F] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirmLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
