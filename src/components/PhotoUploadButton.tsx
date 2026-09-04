import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Check, Images, LoaderCircle, LockKeyhole, SquarePen, Trash2, X } from "lucide-preact";

type PhotoItem = {
  id: string;
  file: File;
  fileName: string;
  previewUrl: string;
  optimized?: Blob;
};

type UploadState = "idle" | "preparing" | "ready" | "uploading" | "success" | "error";

type UploadResponse = {
  success?: boolean;
  createdFiles?: string[];
  message?: string;
};

type UploadTarget = "gallery" | "cover";

const MAX_GALLERY_FILES = 12;
const MAX_LONG_EDGE = 1800;
const INITIAL_JPEG_QUALITY = 0.82;
const MAX_BATCH_BYTES = 3_600_000;

class UploadError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Qualcosa è andato storto durante il caricamento.";
}

function formatBytes(bytes: number) {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1).replace(".", ",")} MB`;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob?.type === "image/jpeg") {
        resolve(blob);
        return;
      }
      reject(new Error("Compressione immagine non riuscita."));
    }, "image/jpeg", quality);
  });
}

async function decodeImage(file: File) {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap as CanvasImageSource,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close()
      };
    } catch {
      // Safari can decode some iPhone formats only through a regular image element.
    }
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = url;

  try {
    await image.decode();
    return {
      source: image as CanvasImageSource,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      cleanup: () => URL.revokeObjectURL(url)
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(`Non riesco a leggere ${file.name}. Prova a esportarla come JPEG.`);
  }
}

async function optimizeImage(file: File, targetBytes: number) {
  const decoded = await decodeImage(file);

  try {
    const longestSide = Math.max(decoded.width, decoded.height) || 1;
    let edge = Math.min(MAX_LONG_EDGE, longestSide);
    let quality = INITIAL_JPEG_QUALITY;
    let result: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const scale = Math.min(1, edge / longestSide);
      const width = Math.max(1, Math.round(decoded.width * scale));
      const height = Math.max(1, Math.round(decoded.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Il browser non supporta l’ottimizzazione delle immagini.");

      context.drawImage(decoded.source, 0, 0, width, height);
      result = await canvasToJpeg(canvas, quality);
      canvas.width = 1;
      canvas.height = 1;

      if (result.size <= targetBytes) return result;

      if (quality > 0.64) {
        quality -= 0.08;
      } else {
        edge = Math.max(960, Math.round(edge * 0.82));
        quality = 0.72;
      }
    }

    if (!result || result.size > targetBytes) {
      throw new Error(`${file.name} resta troppo pesante. Prova a ritagliarla e selezionarla di nuovo.`);
    }

    return result;
  } finally {
    decoded.cleanup();
  }
}

function sendUpload(
  apiUrl: string,
  password: string,
  slug: string,
  hikeTitle: string,
  target: UploadTarget,
  photos: PhotoItem[],
  onProgress: (progress: number) => void
) {
  return new Promise<{ status: number; data: UploadResponse }>((resolve, reject) => {
    const formData = new FormData();
    formData.set("slug", slug);
    formData.set("hikeTitle", hikeTitle);
    formData.set("target", target);

    photos.forEach((photo, index) => {
      if (photo.optimized) {
        formData.append("images", photo.optimized, `photo-${String(index + 1).padStart(2, "0")}.jpg`);
      }
    });

    const request = new XMLHttpRequest();
    request.open("POST", apiUrl);
    request.setRequestHeader("X-Popi-Upload-Password", password);
    request.responseType = "json";
    request.timeout = 240_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      const data = request.response && typeof request.response === "object"
        ? request.response as UploadResponse
        : {};
      resolve({ status: request.status, data });
    };
    request.onerror = () => reject(new UploadError("Connessione interrotta. Le foto sono ancora pronte: riprova."));
    request.ontimeout = () => reject(new UploadError("Il caricamento sta impiegando troppo tempo. Riprova con una connessione stabile."));
    request.send(formData);
  });
}

function getStatusLabel(state: UploadState) {
  switch (state) {
    case "preparing": return "Preparo le foto";
    case "ready": return "Foto pronte";
    case "uploading": return "Caricamento in corso";
    case "success": return "Tutto fatto";
    case "error": return "Serve un piccolo intervento";
    default: return "";
  }
}

export default function PhotoUploadButton({
  slug,
  hikeTitle,
  apiUrl,
  target = "gallery",
  buttonClassName = "",
  iconOnly = false
}: {
  slug: string;
  hikeTitle: string;
  apiUrl: string;
  target?: UploadTarget;
  buttonClassName?: string;
  iconOnly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [busyLabel, setBusyLabel] = useState("");
  const [preparationProgress, setPreparationProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photosRef = useRef<PhotoItem[]>([]);
  const selectionVersionRef = useRef(0);
  const maxFiles = target === "cover" ? 1 : MAX_GALLERY_FILES;
  const isCoverUpload = target === "cover";
  const title = isCoverUpload ? "Aggiorna la copertina" : "Aggiungi foto";
  const buttonLabel = isCoverUpload ? "Modifica cover" : "Aggiungi foto";
  const dialogId = `photo-upload-${target}-${slug.replace(/[^a-z0-9-]/gi, "-")}`;
  const dialogTitleId = `${dialogId}-title`;
  const isBusy = status === "preparing" || status === "uploading";
  const isReady = photos.length > 0 && photos.every((photo) => photo.optimized);
  const canSubmit = password.trim().length > 0 && isReady && !isBusy;
  const optimizedBytes = photos.reduce((total, photo) => total + (photo.optimized?.size || 0), 0);
  const statusLabel = useMemo(() => getStatusLabel(status), [status]);
  const busyRef = useRef(isBusy);
  busyRef.current = isBusy;

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      selectionVersionRef.current += 1;
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
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

  function clearPhotos(nextStatus: UploadState = "idle") {
    selectionVersionRef.current += 1;
    setPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return [];
    });
    setPreparationProgress(0);
    setUploadProgress(0);
    setBusyLabel("");
    setStatus(nextStatus);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function prepareSelection(files: File[]) {
    const version = selectionVersionRef.current + 1;
    selectionVersionRef.current = version;
    setPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file)
      }));
    });
    setMessage("");
    setStatus("preparing");
    setPreparationProgress(0);

    const targetBytes = Math.floor(MAX_BATCH_BYTES / files.length);
    try {
      for (let index = 0; index < files.length; index += 1) {
        setBusyLabel(`Ottimizzo ${index + 1} di ${files.length}…`);
        const optimized = await optimizeImage(files[index], targetBytes);
        if (selectionVersionRef.current !== version) return;
        setPhotos((current) => current.map((photo, photoIndex) => (
          photoIndex === index ? { ...photo, optimized } : photo
        )));
        setPreparationProgress(Math.round(((index + 1) / files.length) * 100));
      }

      if (selectionVersionRef.current !== version) return;
      setStatus("ready");
      setBusyLabel("");
    } catch (error) {
      if (selectionVersionRef.current !== version) return;
      setStatus("error");
      setBusyLabel("");
      setMessage(formatErrorMessage(error));
    }
  }

  function closePanel() {
    if (isBusy) return;
    document.body.classList.remove("upload-modal-open");
    setIsOpen(false);
    setPassword("");
    clearPhotos();
    setMessage("");
  }

  function handleFilesChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const nextFiles = Array.from(input.files || []);
    if (nextFiles.length === 0) return;

    if (nextFiles.length > maxFiles) {
      setStatus("error");
      setMessage(`Puoi scegliere al massimo ${maxFiles} ${maxFiles === 1 ? "foto" : "foto"} per volta.`);
      input.value = "";
      return;
    }

    if (nextFiles.some((file) => !file.type.startsWith("image/"))) {
      setStatus("error");
      setMessage("Seleziona solo foto dalla libreria.");
      input.value = "";
      return;
    }

    void prepareSelection(nextFiles);
  }

  function removePhoto(id: string) {
    const remaining = photos.filter((photo) => photo.id !== id).map((photo) => photo.file);
    if (remaining.length === 0) {
      clearPhotos();
      setMessage("");
      return;
    }
    void prepareSelection(remaining);
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setStatus("uploading");
      setMessage("");
      setUploadProgress(0);
      setBusyLabel("Invio le foto…");

      const { status: responseStatus, data } = await sendUpload(
        apiUrl,
        password,
        slug,
        hikeTitle,
        target,
        photos,
        (progress) => {
          setUploadProgress(progress);
          setBusyLabel(progress < 100 ? `Invio ${progress}%` : "Creo descrizioni e salvo…");
        }
      );

      if (responseStatus < 200 || responseStatus >= 300 || !data.success) {
        throw new UploadError(data.message || "Caricamento non riuscito.", responseStatus);
      }

      setPassword("");
      clearPhotos("success");
      setMessage(data.message || "Foto aggiunte. Saranno online dopo il deploy.");
    } catch (error) {
      setStatus("error");
      setBusyLabel("");
      setMessage(formatErrorMessage(error));
      if (error instanceof UploadError && error.status === 401) {
        setPassword("");
        window.requestAnimationFrame(() => passwordInputRef.current?.focus());
      }
    }
  }

  const actionLabel = isCoverUpload
    ? "Salva copertina"
    : photos.length > 0
      ? `Carica ${photos.length} ${photos.length === 1 ? "foto" : "foto"}`
      : "Carica foto";

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        class={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[8px] px-1.5 py-2 text-[0.8125rem] font-medium leading-none text-[#3F6B4F] transition-colors hover:bg-[#FFFDF7]/70 hover:text-[#25251F] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] focus:ring-offset-2 focus:ring-offset-[#F7F1E3] motion-reduce:transition-none [&_svg]:block [&_svg]:shrink-0 ${buttonClassName}`.trim()}
        onClick={() => {
          document.body.classList.add("upload-modal-open");
          setIsOpen(true);
        }}
        aria-label={buttonLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
      >
        <SquarePen size={16} strokeWidth={1.9} color="currentColor" aria-hidden="true" />
        {!iconOnly && <span>{buttonLabel}</span>}
      </button>

      {isOpen && (
        <div
          class="fixed inset-0 z-[1300] flex items-end justify-center bg-[#25251F]/68 sm:px-4 sm:py-8"
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
            class="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#FFFDF7] shadow-[0_8px_24px_rgba(37,37,31,0.16)] sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:max-w-md sm:rounded-[14px]"
          >
            <div class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#DDD7C9] bg-[#FFFDF7] px-5 py-3.5">
              <div>
                <h2 id={dialogTitleId} class="m-0 text-[length:var(--type-ui-title)] font-bold leading-[var(--type-leading-ui-title)] text-[#25251F]">{title}</h2>
                <p class="mt-1 text-sm text-[#516055]">{hikeTitle}</p>
              </div>
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

            <form class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5" onSubmit={handleSubmit}>
              <label class="block space-y-2">
                <span class="flex items-center gap-2 text-sm font-bold text-[#315334]">
                  <LockKeyhole size={17} strokeWidth={2} aria-hidden="true" />
                  Password
                </span>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onInput={(event) => setPassword((event.currentTarget as HTMLInputElement).value)}
                  class="w-full rounded-[10px] border border-[#DDD7C9] bg-white px-4 py-3 text-base text-[#25251F] outline-none transition-colors placeholder:text-[#68685F] focus:border-[#3F6B4F] focus:ring-2 focus:ring-[#3F6B4F]/20"
                  placeholder="Inserisci la password"
                  autoComplete="current-password"
                  required
                />
                <span class="block text-[0.8125rem] leading-snug text-[#5B665D]">Viene verificata a ogni invio e non resta memorizzata.</span>
              </label>

              <div class="space-y-2">
                <span class="block text-sm font-bold text-[#315334]">{isCoverUpload ? "Foto di copertina" : "Foto dalla libreria"}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple={!isCoverUpload}
                  onChange={handleFilesChange}
                  class="sr-only"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  class="flex min-h-16 w-full items-center gap-3 rounded-[10px] border border-dashed border-[#9BAA9E] bg-white px-4 py-3 text-left text-[#315334] transition-colors hover:border-[#3F6B4F] hover:bg-[#F7F1E3] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E8F0E8]" aria-hidden="true">
                    <Images size={21} strokeWidth={2} />
                  </span>
                  <span>
                    <strong class="block text-sm">{photos.length > 0 ? "Cambia selezione" : "Scegli dalla libreria"}</strong>
                    <span class="mt-0.5 block text-[0.8125rem] leading-snug text-[#5B665D]">
                      {isCoverUpload ? "Una foto, pronta per il sito" : `Fino a ${MAX_GALLERY_FILES} foto in un solo invio`}
                    </span>
                  </span>
                </button>
              </div>

              {photos.length > 0 && (
                <section aria-label="Foto selezionate" class="space-y-2">
                  <div class="flex items-center justify-between gap-3 text-sm">
                    <strong class="text-[#25251F]">{photos.length} {photos.length === 1 ? "foto" : "foto"}</strong>
                    {isReady && <span class="inline-flex items-center gap-1.5 text-[#315334]"><Check size={16} aria-hidden="true" /> {formatBytes(optimizedBytes)}</span>}
                  </div>
                  <div class="grid grid-cols-3 gap-2 rounded-[10px] bg-[#F7F1E3] p-2">
                    {photos.map((photo) => (
                      <figure key={photo.id} class="relative overflow-hidden rounded-[6px] bg-white">
                        <img src={photo.previewUrl} alt="" class="aspect-square h-full w-full object-cover" />
                        {!isBusy && (
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            aria-label={`Rimuovi ${photo.fileName}`}
                            class="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-[10px] bg-[#25251F]/82 text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                          >
                            <Trash2 size={17} strokeWidth={2.1} aria-hidden="true" />
                          </button>
                        )}
                      </figure>
                    ))}
                  </div>
                </section>
              )}

              {(statusLabel || message || busyLabel) && (
                <div
                  role={status === "error" ? "alert" : "status"}
                  aria-live={status === "error" ? "assertive" : "polite"}
                  class={`rounded-[10px] px-4 py-3 text-sm ${status === "error" ? "bg-[#fff1eb] text-[#7A361F]" : status === "success" ? "bg-[#edf6ee] text-[#295033]" : "bg-[#F7F1E3] text-[#315334]"}`}
                >
                  <div class="flex items-center gap-2 font-bold">
                    {isBusy && <LoaderCircle size={17} class="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    {statusLabel}
                  </div>
                  {busyLabel && <p class="mt-1">{busyLabel}</p>}
                  {message && <p class="mt-1">{message}</p>}
                  {(status === "preparing" || status === "uploading") && (
                    <div
                      class="mt-3 h-1.5 overflow-hidden rounded-full bg-white"
                      role="progressbar"
                      aria-label={status === "preparing" ? "Ottimizzazione foto" : "Invio foto"}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={status === "preparing" ? preparationProgress : uploadProgress}
                    >
                      <span
                        class="block h-full rounded-full bg-[#3F6B4F] transition-[width] duration-200 motion-reduce:transition-none"
                        style={{ width: `${status === "preparing" ? preparationProgress : uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div class="sticky bottom-0 -mx-5 mt-auto flex gap-3 border-t border-[#DDD7C9] bg-[#FFFDF7] px-5 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-4">
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
                  class="inline-flex min-h-12 flex-[1.35] items-center justify-center rounded-[10px] bg-[#3F6B4F] px-4 py-3 text-sm font-bold text-[#FFFDF7] transition-colors hover:bg-[#25251F] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
