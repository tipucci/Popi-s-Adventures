import type { APIContext } from "astro";
import { getSecret } from "astro:env/server";

export const prerender = false;

const MAX_FILES = 12;
const MAX_UPLOAD_BYTES = 3_800_000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HIKES_ROOT = "src/assets/images/hikes";
const UPLOADED_METADATA_PATH = "src/data/uploadedHikeImageMeta.json";

type UploadPayload = {
  slug: string;
  target: "gallery" | "cover";
  images: Array<{
    base64Content: string;
  }>;
  descriptions: Array<{
    alt: string;
    caption: string;
  }>;
};

type GitHubTreeItem = {
  path: string;
  type: string;
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
  const value = getSecret(name);
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
  const target = formData.get("target") === "cover" ? "cover" : "gallery";
  const files = formData.getAll("images").filter((entry): entry is File => typeof entry !== "string");
  const totalBytes = files.reduce((total, file) => total + file.size, 0);

  if (totalBytes > MAX_UPLOAD_BYTES) {
    throw new UploadRequestError("Le foto superano il limite del singolo invio. Selezionale di nuovo per ottimizzarle.", 413);
  }

  if (files.some((file) => file.type !== "image/jpeg" || file.size === 0)) {
    throw new UploadRequestError("Ogni file deve essere una foto JPEG valida.", 400);
  }

  let rawDescriptions: unknown;
  try {
    rawDescriptions = JSON.parse(String(formData.get("descriptions") || ""));
  } catch {
    throw new UploadRequestError("Le descrizioni delle foto non sono valide.", 400);
  }

  if (!Array.isArray(rawDescriptions) || rawDescriptions.length !== files.length) {
    throw new UploadRequestError("Ogni foto deve avere la propria descrizione.", 400);
  }

  const descriptions = rawDescriptions.map((description, index) => {
    const alt = typeof description === "object" && description
      ? String((description as Record<string, unknown>).alt || "").trim()
      : "";
    const caption = typeof description === "object" && description
      ? String((description as Record<string, unknown>).caption || "").trim()
      : "";

    if (alt && (alt.length < 12 || alt.length > 220)) {
      throw new UploadRequestError(`Il testo alternativo della foto ${index + 1} deve contenere da 12 a 220 caratteri.`, 400);
    }

    if (target === "gallery" && caption && (caption.length < 3 || caption.length > 100)) {
      throw new UploadRequestError(`La didascalia della foto ${index + 1} deve contenere da 3 a 100 caratteri.`, 400);
    }

    return { alt, caption: target === "cover" ? "" : caption };
  });

  const images = await Promise.all(files.map(async (file) => {
    const base64Content = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
    return { base64Content };
  }));

  return { slug, target, images, descriptions };
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
    throw new Error("Il file dei metadati delle foto non può essere letto.");
  }

  const parsed = JSON.parse(decodeBase64Text(data.content));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Il file dei metadati delle foto non è valido.");
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
    const { slug, target, images, descriptions } = await parseUploadRequest(request);

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
      base64Content: string;
      fileName: string;
      filePath: string;
      description: { alt: string; caption: string; };
    }> = [];

    if (target === "cover") {
      const fileName = "cover.jpg";
      const filePath = `${directoryPath}/cover.jpg`;
      preparedImages.push({
        base64Content: images[0].base64Content,
        fileName,
        filePath,
        description: descriptions[0]
      });
    } else {
      let nextIndex = getNextGalleryIndex(existingPaths);
      for (const [index, image] of images.entries()) {
        const fileName = `gallery-${String(nextIndex).padStart(2, "0")}.jpg`;
        const filePath = `${directoryPath}/${fileName}`;

        if (existingPaths.includes(filePath) || preparedImages.some((item) => item.filePath === filePath)) {
          nextIndex += 1;
          continue;
        }

        preparedImages.push({
          base64Content: image.base64Content,
          fileName,
          filePath,
          description: descriptions[index]
        });
        nextIndex += 1;
      }
    }

    if (preparedImages.length === 0) {
      return json({ success: false, createdFiles: [], message: "Nessun nuovo file da creare." }, 409);
    }

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
        coverAlt: preparedImages[0].description.alt
      };
    } else {
      const newFileNames = new Set(preparedImages.map((image) => image.fileName));
      uploadedMetadata[slug] = {
        ...currentMetadata,
        gallery: [
          ...(currentMetadata.gallery || []).filter((item) => !newFileNames.has(item.file)),
          ...preparedImages.map((image) => ({
            file: image.fileName,
            alt: image.description.alt,
            caption: image.description.caption
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
      : `${createdFiles.length} ${createdFiles.length === 1 ? "foto aggiunta" : "foto aggiunte"} con le relative descrizioni.`;
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
