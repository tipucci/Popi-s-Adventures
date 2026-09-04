import type { APIContext } from "astro";

export const prerender = false;

const MAX_FILES = 12;
const MAX_UPLOAD_BYTES = 3_800_000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HIKES_ROOT = "src/assets/images/hikes";
const UPLOADED_METADATA_PATH = "src/data/uploadedHikeImageMeta.json";
const DEFAULT_VISION_MODEL = "gpt-4o-mini";

type UploadPayload = {
  slug: string;
  hikeTitle: string;
  target: "gallery" | "cover";
  images: Array<{
    dataUrl: string;
    base64Content: string;
  }>;
};

type GitHubTreeItem = {
  path: string;
  type: string;
};

type PhotoDescription = {
  index: number;
  alt: string;
  caption: string;
};

type UploadedHikeImageMeta = Record<string, {
  coverAlt?: string;
  gallery?: Array<{
    file: string;
    alt: string;
    caption: string;
  }>;
}>;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function getEnv(name: string, required = true) {
  const value = import.meta.env[name];
  if (value) return value;
  if (required) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return "";
}

function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug);
}

function getDirectoryPath(slug: string) {
  return `${HIKES_ROOT}/${slug}`;
}

async function passwordsMatch(received: string, expected: string) {
  const encoder = new TextEncoder();
  const [receivedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(received)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected))
  ]);
  const receivedBytes = new Uint8Array(receivedHash);
  const expectedBytes = new Uint8Array(expectedHash);
  let difference = 0;

  for (let index = 0; index < expectedBytes.length; index += 1) {
    difference |= receivedBytes[index] ^ expectedBytes[index];
  }

  return difference === 0;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function parseUploadRequest(request: Request): Promise<UploadPayload> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new UploadRequestError("Formato richiesta non supportato.", 415);
  }

  const formData = await request.formData();
  const slug = String(formData.get("slug") || "");
  const hikeTitle = String(formData.get("hikeTitle") || slug).trim().slice(0, 160);
  const target = formData.get("target") === "cover" ? "cover" : "gallery";
  const files = formData.getAll("images").filter((entry): entry is File => typeof entry !== "string");
  const totalBytes = files.reduce((total, file) => total + file.size, 0);

  if (totalBytes > MAX_UPLOAD_BYTES) {
    throw new UploadRequestError("Le foto superano il limite del singolo invio. Selezionale di nuovo per ottimizzarle.", 413);
  }

  if (files.some((file) => file.type !== "image/jpeg" || file.size === 0)) {
    throw new UploadRequestError("Ogni file deve essere una foto JPEG valida.", 400);
  }

  const images = await Promise.all(files.map(async (file) => {
    const base64Content = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
    return {
      base64Content,
      dataUrl: `data:image/jpeg;base64,${base64Content}`
    };
  }));

  return { slug, hikeTitle, target, images };
}

class UploadRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function encodeTextAsBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeBase64Text(value: string) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function getResponseOutputText(data: any) {
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

async function describePhotos(
  images: string[],
  hikeTitle: string,
  target: "gallery" | "cover",
  apiKey: string,
  model: string
) {
  const imageContent = images.flatMap((image, index) => [
    { type: "input_text", text: `Foto ${index + 1}` },
    { type: "input_image", image_url: image, detail: "low" }
  ]);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions: [
        "Analizza fotografie reali di un diario escursionistico.",
        "Scrivi in italiano naturale e concreto, descrivendo soltanto elementi chiaramente visibili.",
        "Non identificare persone, non attribuire nomi e non dedurre caratteristiche sensibili.",
        "L'alt text deve essere una frase accessibile e specifica, senza iniziare con 'foto di' o 'immagine di'.",
        "La caption deve essere una breve nota editoriale di 3-10 parole, nello stile caldo di un diario personale.",
        "Non inventare luoghi, eventi, relazioni o dettagli non visibili."
      ].join(" "),
      input: [{
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Escursione: ${hikeTitle}. Tipo: ${target === "cover" ? "copertina" : "galleria"}. Restituisci una descrizione per ogni foto, mantenendo lo stesso indice.`
          },
          ...imageContent
        ]
      }],
      max_output_tokens: Math.max(300, images.length * 120),
      text: {
        format: {
          type: "json_schema",
          name: "hike_photo_descriptions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              photos: {
                type: "array",
                minItems: images.length,
                maxItems: images.length,
                items: {
                  type: "object",
                  properties: {
                    index: { type: "integer", minimum: 0, maximum: images.length - 1 },
                    alt: { type: "string", minLength: 12, maxLength: 220 },
                    caption: { type: "string", minLength: 3, maxLength: 100 }
                  },
                  required: ["index", "alt", "caption"],
                  additionalProperties: false
                }
              }
            },
            required: ["photos"],
            additionalProperties: false
          }
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Analisi automatica non riuscita (${response.status}): ${detail || "riprova più tardi."}`);
  }

  const data = await response.json();
  const outputText = getResponseOutputText(data);
  if (!outputText) {
    throw new Error("L'analisi automatica non ha restituito descrizioni.");
  }

  const parsed = JSON.parse(outputText) as { photos?: PhotoDescription[] };
  const photos = Array.isArray(parsed.photos) ? parsed.photos : [];
  const byIndex = new Map(photos.map((photo) => [photo.index, photo]));

  if (photos.length !== images.length || byIndex.size !== images.length) {
    throw new Error("L'analisi automatica non ha descritto tutte le foto.");
  }

  return images.map((_, index) => {
    const photo = byIndex.get(index);
    const alt = String(photo?.alt || "").trim();
    const caption = String(photo?.caption || "").trim();

    if (!alt || !caption) {
      throw new Error(`Descrizione incompleta per la foto ${index + 1}.`);
    }

    return { index, alt, caption };
  });
}

async function githubRequest(
  path: string,
  token: string,
  init: RequestInit = {}
) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "popi-photo-upload",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub API error (${response.status}): ${detail || "richiesta non riuscita."}`);
  }

  return response;
}

async function getUploadedImageMetadata(
  owner: string,
  repo: string,
  commitSha: string,
  token: string
) {
  const response = await githubRequest(
    `/repos/${owner}/${repo}/contents/${UPLOADED_METADATA_PATH}?ref=${encodeURIComponent(commitSha)}`,
    token
  );
  const data = await response.json();

  if (data.encoding !== "base64" || typeof data.content !== "string") {
    throw new Error("Il file dei metadati automatici non può essere letto.");
  }

  const parsed = JSON.parse(decodeBase64Text(data.content));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Il file dei metadati automatici non è valido.");
  }

  return parsed as UploadedHikeImageMeta;
}

async function getBranchHeadSha(owner: string, repo: string, branch: string, token: string) {
  const response = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
  const data = await response.json();
  return data.object?.sha as string;
}

async function getCommitTreeSha(owner: string, repo: string, commitSha: string, token: string) {
  const response = await githubRequest(`/repos/${owner}/${repo}/git/commits/${commitSha}`, token);
  const data = await response.json();
  return data.tree?.sha as string;
}

async function getExistingPaths(owner: string, repo: string, treeSha: string, slug: string, token: string) {
  const response = await githubRequest(
    `/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    token
  );
  const data = await response.json();
  const directoryPath = `${getDirectoryPath(slug)}/`;
  const tree = Array.isArray(data.tree) ? (data.tree as GitHubTreeItem[]) : [];

  return tree
    .filter((item) => item.type === "blob" && item.path.startsWith(directoryPath))
    .map((item) => item.path);
}

function getNextGalleryIndex(existingPaths: string[]) {
  const usedIndexes = existingPaths
    .map((path) => path.match(/gallery-(\d+)\.(jpg|jpeg|png|webp|avif|svg)$/i))
    .filter(Boolean)
    .map((match) => Number(match?.[1] || 0))
    .filter((value) => Number.isInteger(value) && value > 0);

  return usedIndexes.length > 0 ? Math.max(...usedIndexes) + 1 : 1;
}

async function createBlob(owner: string, repo: string, token: string, content: string) {
  const response = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, token, {
    method: "POST",
    body: JSON.stringify({
      content,
      encoding: "base64"
    })
  });
  const data = await response.json();
  return data.sha as string;
}

async function createTree(
  owner: string,
  repo: string,
  token: string,
  baseTree: string,
  entries: Array<{ path: string; sha: string; }>
) {
  const response = await githubRequest(`/repos/${owner}/${repo}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseTree,
      tree: entries.map((entry) => ({
        path: entry.path,
        mode: "100644",
        type: "blob",
        sha: entry.sha
      }))
    })
  });
  const data = await response.json();
  return data.sha as string;
}

async function createCommit(owner: string, repo: string, token: string, treeSha: string, parentCommitSha: string, slug: string) {
  return createCommitWithMessage(owner, repo, token, treeSha, parentCommitSha, `Add hike photos for ${slug}`);
}

async function createCommitWithMessage(owner: string, repo: string, token: string, treeSha: string, parentCommitSha: string, message: string) {
  const response = await githubRequest(`/repos/${owner}/${repo}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents: [parentCommitSha]
    })
  });
  const data = await response.json();
  return data.sha as string;
}

async function updateBranchRef(owner: string, repo: string, token: string, branch: string, commitSha: string) {
  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      sha: commitSha,
      force: false
    })
  });
}

async function triggerDeployHook(url: string) {
  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Deploy hook Vercel non riuscito (${response.status}).`);
  }
}

export async function POST({ request }: APIContext) {
  try {
    const adminPassword = getEnv("ADMIN_UPLOAD_PASSWORD");
    const password = request.headers.get("x-popi-upload-password") || "";
    if (!await passwordsMatch(password, adminPassword)) {
      return json({ success: false, createdFiles: [], message: "Password non valida." }, 401);
    }

    const githubToken = getEnv("GITHUB_TOKEN");
    const githubOwner = getEnv("GITHUB_OWNER");
    const githubRepo = getEnv("GITHUB_REPO");
    const githubBranch = getEnv("GITHUB_BRANCH");
    const deployHookUrl = getEnv("VERCEL_DEPLOY_HOOK_URL", false);
    const openaiApiKey = getEnv("OPENAI_API_KEY");
    const visionModel = getEnv("OPENAI_IMAGE_DESCRIPTION_MODEL", false) || DEFAULT_VISION_MODEL;

    const { slug, hikeTitle, target, images } = await parseUploadRequest(request);

    if (!isValidSlug(slug)) {
      return json({ success: false, createdFiles: [], message: "Slug non valido." }, 400);
    }

    if (target === "cover" && images.length !== 1) {
      return json(
        { success: false, createdFiles: [], message: "Per la cover puoi inviare una sola immagine." },
        400
      );
    }

    if (target === "gallery" && (images.length === 0 || images.length > MAX_FILES)) {
      return json(
        { success: false, createdFiles: [], message: `Puoi inviare da 1 a ${MAX_FILES} immagini per richiesta.` },
        400
      );
    }

    const headCommitSha = await getBranchHeadSha(githubOwner, githubRepo, githubBranch, githubToken);
    const baseTreeSha = await getCommitTreeSha(githubOwner, githubRepo, headCommitSha, githubToken);
    const existingPaths = await getExistingPaths(githubOwner, githubRepo, baseTreeSha, slug, githubToken);
    const directoryPath = getDirectoryPath(slug);

    const preparedImages: Array<{
      dataUrl: string;
      base64Content: string;
      fileName: string;
      filePath: string;
    }> = [];

    if (target === "cover") {
      const fileName = "cover.jpg";
      const filePath = `${directoryPath}/cover.jpg`;
      preparedImages.push({
        dataUrl: images[0].dataUrl,
        base64Content: images[0].base64Content,
        fileName,
        filePath
      });
    } else {
      let nextIndex = getNextGalleryIndex(existingPaths);
      for (const image of images) {
        const fileName = `gallery-${String(nextIndex).padStart(2, "0")}.jpg`;
        const filePath = `${directoryPath}/${fileName}`;

        if (existingPaths.includes(filePath) || preparedImages.some((item) => item.filePath === filePath)) {
          nextIndex += 1;
          continue;
        }

        preparedImages.push({
          dataUrl: image.dataUrl,
          base64Content: image.base64Content,
          fileName,
          filePath
        });
        nextIndex += 1;
      }
    }

    if (preparedImages.length === 0) {
      return json({ success: false, createdFiles: [], message: "Nessun nuovo file da creare." }, 409);
    }

    const descriptions = await describePhotos(
      preparedImages.map((image) => image.dataUrl),
      hikeTitle,
      target,
      openaiApiKey,
      visionModel
    );
    const uploadedMetadata = await getUploadedImageMetadata(
      githubOwner,
      githubRepo,
      headCommitSha,
      githubToken
    );
    const currentMetadata = uploadedMetadata[slug] || {};

    if (target === "cover") {
      uploadedMetadata[slug] = {
        ...currentMetadata,
        coverAlt: descriptions[0].alt
      };
    } else {
      const newFileNames = new Set(preparedImages.map((image) => image.fileName));
      uploadedMetadata[slug] = {
        ...currentMetadata,
        gallery: [
          ...(currentMetadata.gallery || []).filter((item) => !newFileNames.has(item.file)),
          ...preparedImages.map((image, index) => ({
            file: image.fileName,
            alt: descriptions[index].alt,
            caption: descriptions[index].caption
          }))
        ]
      };
    }

    const metadataContent = encodeTextAsBase64(`${JSON.stringify(uploadedMetadata, null, 2)}\n`);
    const [metadataBlobSha, ...imageBlobShas] = await Promise.all([
      createBlob(githubOwner, githubRepo, githubToken, metadataContent),
      ...preparedImages.map((image) =>
        createBlob(githubOwner, githubRepo, githubToken, image.base64Content)
      )
    ]);
    const blobEntries = [
      { path: UPLOADED_METADATA_PATH, sha: metadataBlobSha },
      ...preparedImages.map((image, index) => ({
        path: image.filePath,
        sha: imageBlobShas[index]
      }))
    ];
    const createdFiles = preparedImages.map((image) => image.filePath);

    const newTreeSha = await createTree(githubOwner, githubRepo, githubToken, baseTreeSha, blobEntries);
    const commitMessage = target === "cover" ? `Update hike cover for ${slug}` : `Add hike photos for ${slug}`;
    const commitSha = await createCommitWithMessage(githubOwner, githubRepo, githubToken, newTreeSha, headCommitSha, commitMessage);
    await updateBranchRef(githubOwner, githubRepo, githubToken, githubBranch, commitSha);

    let message = target === "cover"
      ? "Cover e descrizione aggiornate con successo."
      : `${createdFiles.length} ${createdFiles.length === 1 ? "foto aggiunta" : "foto aggiunte"} con descrizione automatica.`;
    if (deployHookUrl) {
      try {
        await triggerDeployHook(deployHookUrl);
        message = `${message} Deploy Vercel avviato.`;
      } catch (error) {
        message = `${message} Commit creato, ma il deploy hook non e' partito: ${error instanceof Error ? error.message : "errore sconosciuto."}`;
      }
    }

    return json({
      success: true,
      createdFiles,
      message
    });
  } catch (error) {
    const status = error instanceof UploadRequestError ? error.status : 500;
    return json(
      {
        success: false,
        createdFiles: [],
        message: error instanceof Error ? error.message : "Errore interno durante l'upload."
      },
      status
    );
  }
}
