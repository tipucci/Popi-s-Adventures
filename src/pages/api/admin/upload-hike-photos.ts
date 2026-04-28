import type { APIContext } from "astro";

export const prerender = false;

const MAX_FILES = 12;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_DATA_URL_PATTERN = /^data:image\/jpeg;base64,[a-z0-9+/=]+$/i;
const HIKES_ROOT = "src/assets/images/hikes";

type UploadPayload = {
  password?: string;
  slug?: string;
  images?: string[];
};

type GitHubTreeItem = {
  path: string;
  type: string;
};

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

function extractBase64Content(dataUrl: string) {
  if (!IMAGE_DATA_URL_PATTERN.test(dataUrl)) {
    throw new Error("Ogni immagine deve essere un data URL JPEG valido.");
  }

  const [, base64Content = ""] = dataUrl.split(",", 2);
  if (!base64Content) {
    throw new Error("Immagine JPEG non valida.");
  }

  return base64Content;
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
  const response = await githubRequest(`/repos/${owner}/${repo}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({
      message: `Add hike photos for ${slug}`,
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
    const githubToken = getEnv("GITHUB_TOKEN");
    const githubOwner = getEnv("GITHUB_OWNER");
    const githubRepo = getEnv("GITHUB_REPO");
    const githubBranch = getEnv("GITHUB_BRANCH");
    const adminPassword = getEnv("ADMIN_UPLOAD_PASSWORD");
    const deployHookUrl = getEnv("VERCEL_DEPLOY_HOOK_URL", false);

    const payload = (await request.json().catch(() => null)) as UploadPayload | null;
    if (!payload) {
      return json({ success: false, createdFiles: [], message: "Body JSON non valido." }, 400);
    }

    const password = String(payload.password || "");
    const slug = String(payload.slug || "");
    const images = Array.isArray(payload.images) ? payload.images : [];

    if (password !== adminPassword) {
      return json({ success: false, createdFiles: [], message: "Password non valida." }, 401);
    }

    if (!isValidSlug(slug)) {
      return json({ success: false, createdFiles: [], message: "Slug non valido." }, 400);
    }

    if (images.length === 0 || images.length > MAX_FILES) {
      return json(
        { success: false, createdFiles: [], message: `Puoi inviare da 1 a ${MAX_FILES} immagini per richiesta.` },
        400
      );
    }

    const headCommitSha = await getBranchHeadSha(githubOwner, githubRepo, githubBranch, githubToken);
    const baseTreeSha = await getCommitTreeSha(githubOwner, githubRepo, headCommitSha, githubToken);
    const existingPaths = await getExistingPaths(githubOwner, githubRepo, baseTreeSha, slug, githubToken);
    const directoryPath = getDirectoryPath(slug);

    let nextIndex = getNextGalleryIndex(existingPaths);
    const createdFiles: string[] = [];

    const blobEntries = [];
    for (const image of images) {
      const base64Content = extractBase64Content(image);
      const fileName = `gallery-${String(nextIndex).padStart(2, "0")}.jpg`;
      const filePath = `${directoryPath}/${fileName}`;

      if (existingPaths.includes(filePath) || createdFiles.includes(filePath)) {
        nextIndex += 1;
        continue;
      }

      const blobSha = await createBlob(githubOwner, githubRepo, githubToken, base64Content);
      blobEntries.push({ path: filePath, sha: blobSha });
      createdFiles.push(filePath);
      nextIndex += 1;
    }

    if (blobEntries.length === 0) {
      return json({ success: false, createdFiles: [], message: "Nessun nuovo file da creare." }, 409);
    }

    const newTreeSha = await createTree(githubOwner, githubRepo, githubToken, baseTreeSha, blobEntries);
    const commitSha = await createCommit(githubOwner, githubRepo, githubToken, newTreeSha, headCommitSha, slug);
    await updateBranchRef(githubOwner, githubRepo, githubToken, githubBranch, commitSha);

    let message = `${createdFiles.length} ${createdFiles.length === 1 ? "foto aggiunta" : "foto aggiunte"} con successo.`;
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
    return json(
      {
        success: false,
        createdFiles: [],
        message: error instanceof Error ? error.message : "Errore interno durante l'upload."
      },
      500
    );
  }
}
