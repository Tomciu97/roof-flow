const VERCEL_API = "https://api.vercel.com";

function getAuthHeaders() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    throw new Error("Brak VERCEL_API_TOKEN — wymagany do obsługi domen PRO.");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function projectPath() {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) {
    throw new Error("Brak VERCEL_PROJECT_ID.");
  }
  const team = process.env.VERCEL_TEAM_ID;
  const qs = team ? `?teamId=${team}` : "";
  return `/v9/projects/${projectId}/domains${qs}`;
}

export async function addCustomDomain(domain: string) {
  const res = await fetch(`${VERCEL_API}${projectPath()}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: domain }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.error?.message || data?.error?.code || "Nie udało się dodać domeny."
    );
  }
  return data;
}

export async function getDomainConfig(domain: string) {
  const team = process.env.VERCEL_TEAM_ID;
  const qs = team ? `?teamId=${team}` : "";
  const res = await fetch(
    `${VERCEL_API}/v6/domains/${encodeURIComponent(domain)}/config${qs}`,
    { headers: getAuthHeaders() }
  );
  return res.json();
}

export async function removeCustomDomain(domain: string) {
  const team = process.env.VERCEL_TEAM_ID;
  const qs = team ? `?teamId=${team}` : "";
  const projectId = process.env.VERCEL_PROJECT_ID!;
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${qs}`,
    { method: "DELETE", headers: getAuthHeaders() }
  );
  return res.json();
}
