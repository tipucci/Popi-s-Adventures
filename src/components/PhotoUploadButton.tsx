import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

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
  buttonClassName = ""
}: {
  slug: string;
  apiUrl: string;
  target?: UploadTarget;
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);
  const [busyLabel, setBusyLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const maxFiles = target === "cover" ? 1 : MAX_GALLERY_FILES;
  const isCoverUpload = target === "cover";
  const eyebrow = isCoverUpload ? "Cover escursione" : "Upload foto";
  const title = isCoverUpload ? "Aggiorna l'immagine di copertina" : "Aggiungi immagini a questa escursione";
  const buttonLabel = isCoverUpload ? "Aggiungi cover" : "Aggiungi foto";
  const confirmLabel = isCoverUpload ? "Salva cover" : "Conferma";

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
      document.body.classList.remove("upload-modal-open");
    };
  }, [previews]);

  const isBusy = status === "compressing" || status === "uploading";
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
        type="button"
        class={`inline-flex items-center justify-center rounded-full bg-forest-700 px-5 py-3 text-sm font-bold text-[#fffaf3] shadow-card transition hover:bg-forest-600 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:ring-offset-2 focus:ring-offset-[#f5ebdc] ${buttonClassName}`.trim()}
        onClick={() => {
          document.body.classList.add("upload-modal-open");
          setIsOpen(true);
        }}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div class="fixed inset-0 z-[1300] flex items-end justify-center bg-[#173328]/55 px-4 pb-4 pt-6 sm:items-center sm:py-8">
          <div class="max-h-[calc(100vh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-white/70 bg-[#fffaf4] shadow-2xl">
            <div class="border-b border-[#eadac8] px-5 py-4">
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-terracotta-600">{eyebrow}</p>
              <h2 class="mt-1 text-2xl font-black text-forest-800">{title}</h2>
            </div>

            <form class="space-y-4 px-5 py-5" onSubmit={handleSubmit}>
              <label class="block space-y-2">
                <span class="text-sm font-bold text-forest-800">Password</span>
                <input
                  type="password"
                  value={password}
                  onInput={(event) => setPassword((event.currentTarget as HTMLInputElement).value)}
                  class="w-full rounded-[1rem] border border-[#d8c5ae] bg-white px-4 py-3 text-base text-forest-800 outline-none transition placeholder:text-forest-700/55 focus:border-terracotta-400"
                  placeholder="Inserisci la password"
                  autoComplete="current-password"
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
                  class="block w-full rounded-[1rem] border border-dashed border-[#d8c5ae] bg-white px-4 py-3 text-sm text-forest-700 file:mr-3 file:rounded-full file:border-0 file:bg-terracotta-50 file:px-4 file:py-2 file:font-bold file:text-terracotta-700"
                />
              </label>

              {selectedFiles.length > 0 && (
                <p class="text-sm font-semibold text-forest-700">
                  {selectedFiles.length} {selectedFiles.length === 1 ? "immagine selezionata" : "immagini selezionate"}
                </p>
              )}

              {previews.length > 0 && (
                <div class="grid grid-cols-3 gap-2 rounded-[1.25rem] bg-cream p-2">
                  {previews.map((preview) => (
                    <figure key={preview.id} class="overflow-hidden rounded-[1rem] bg-white shadow-sm">
                      <img src={preview.url} alt={preview.fileName} class="aspect-square h-full w-full object-cover" />
                    </figure>
                  ))}
                </div>
              )}

              {(statusLabel || message || busyLabel) && (
                <div
                  class={`rounded-[1.25rem] px-4 py-3 text-sm ${
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

              <div class="sticky bottom-0 -mx-5 flex gap-3 border-t border-[#eadac8] bg-[#fffaf4] px-5 pb-1 pt-4">
                <button
                  type="button"
                  onClick={closePanel}
                  disabled={isBusy}
                  class="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-[#d9c7b2] bg-white px-4 py-3 text-sm font-bold text-forest-800 transition hover:bg-[#fffdfa] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Chiudi
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  class="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-forest-700 px-4 py-3 text-sm font-bold text-[#fffaf3] transition hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-60"
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
