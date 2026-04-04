const GITHUB_API = "https://api.github.com";
const OWNER = "bossxomlut";
const REPO = "drag_spend_android";

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export async function getLatestCommitSha(): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/git/ref/heads/master`,
    { headers: headers(), cache: "no-store" },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub get-ref failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { object: { sha: string } };
  return data.object.sha;
}

/** Returns null if the tag was created, throws on unexpected errors.
 *  Returns "exists" if the tag already exists (422). */
export async function createTag(
  tag: string,
  sha: string,
): Promise<"created" | "exists"> {
  const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/git/refs`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ref: `refs/tags/${tag}`, sha }),
  });

  if (res.status === 422) return "exists";

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub create-tag failed (${res.status}): ${body}`);
  }

  return "created";
}
