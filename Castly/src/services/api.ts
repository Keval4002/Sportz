import type { Match, Commentary, ChatMessage } from "../types";
import { API_BASE } from "../config";

/**
 * REST API integration layer.
 * Fetches real data from the backend database.
 */

export async function fetchMatches(limit = 50): Promise<Match[]> {
  const res = await fetch(`${API_BASE}/matches?limit=${limit}`);
  if (!res.ok) throw new Error(`GET /matches failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

export async function fetchCommentary(
  matchId: number,
  limit = 100,
): Promise<Commentary[]> {
  const res = await fetch(
    `${API_BASE}/matches/${matchId}/commentary?limit=${limit}`,
  );
  if (!res.ok) throw new Error(`GET /commentary failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

export async function fetchChat(
  matchId: number,
  limit = 100,
): Promise<ChatMessage[]> {
  const res = await fetch(
    `${API_BASE}/matches/${matchId}/chat?limit=${limit}`,
  );
  if (!res.ok) throw new Error(`GET /chat failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

export async function postChat(
  matchId: number,
  author: string,
  message: string,
): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/matches/${matchId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author, message }),
  });
  if (!res.ok) throw new Error(`POST /chat failed: ${res.status}`);
  const json = await res.json();
  return json.data;
}
