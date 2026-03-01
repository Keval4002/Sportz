/**
 * Shared data used by both the simulation engine and the augmentation layer.
 * Single source of truth — avoids duplication.
 */

/* ─── Player Registry ───────────────────────────────────── */

export const PLAYERS: Record<string, string[]> = {
  Arsenal: [
    "Bukayo Saka",
    "Martin Ødegaard",
    "Gabriel Jesus",
    "Declan Rice",
    "William Saliba",
    "David Raya",
  ],
  Chelsea: [
    "Cole Palmer",
    "Enzo Fernández",
    "Raheem Sterling",
    "Moisés Caicedo",
    "Thiago Silva",
    "Robert Sánchez",
  ],
  "Real Madrid": [
    "Vinícius Jr",
    "Jude Bellingham",
    "Federico Valverde",
    "Toni Kroos",
    "Dani Carvajal",
    "Thibaut Courtois",
  ],
  Barcelona: [
    "Lamine Yamal",
    "Pedri",
    "Robert Lewandowski",
    "Gavi",
    "Ronald Araújo",
    "Marc-André ter Stegen",
  ],
  Liverpool: [
    "Mohamed Salah",
    "Darwin Núñez",
    "Trent Alexander-Arnold",
    "Virgil van Dijk",
    "Alisson Becker",
    "Dominik Szoboszlai",
  ],
  "Man United": [
    "Marcus Rashford",
    "Bruno Fernandes",
    "Kobbie Mainoo",
    "Rasmus Højlund",
    "Lisandro Martínez",
    "André Onana",
  ],
  India: [
    "Sunil Chhetri",
    "Sandesh Jhingan",
    "Gurpreet Singh Sandhu",
    "Anirudh Thapa",
    "Liston Colaco",
    "Sahal Abdul Samad",
  ],
  Australia: [
    "Mathew Leckie",
    "Jackson Irvine",
    "Mathew Ryan",
    "Awer Mabil",
    "Riley McGree",
    "Harry Souttar",
  ],
  Lakers: [
    "LeBron James",
    "Anthony Davis",
    "Austin Reaves",
    "D'Angelo Russell",
    "Rui Hachimura",
    "Jarred Vanderbilt",
  ],
  Warriors: [
    "Stephen Curry",
    "Klay Thompson",
    "Draymond Green",
    "Andrew Wiggins",
    "Kevon Looney",
    "Chris Paul",
  ],
};

/** Generic players used when a team isn't in the registry */
const GENERIC_PLAYERS = [
  "Player 7",
  "Player 10",
  "Player 9",
  "Player 4",
  "Player 1",
  "Player 11",
];

export function getPlayersForTeam(team: string): string[] {
  return PLAYERS[team] ?? GENERIC_PLAYERS;
}

/* ─── Chat Names & Reactions ────────────────────────────── */

export const CHAT_NAMES = [
  "FootballFan42",
  "GoalMachine",
  "PitchSide",
  "TacticalMind",
  "MatchDay99",
  "TopCorner",
  "KickOff_King",
  "FinalWhistle",
  "HalfTimeShow",
  "ExtraTime",
  "WinStreak",
  "FairPlay",
  "SidelineView",
  "CrossBar_Hero",
  "PenaltyBox",
  "OffsideTrap",
];

export const CHAT_REACTIONS: Record<string, string[]> = {
  goal: [
    "GOAAAAL!! 🎉",
    "What a finish!",
    "GET IN!",
    "Incredible!",
    "Clinical finish!",
    "No stopping that one!",
    "YESSS!!",
  ],
  save: [
    "What a save!",
    "Keeper's having a great game",
    "Unbelievable reflexes!",
    "How did he save that?!",
  ],
  foul: [
    "That's a foul all day",
    "Ref should've given a card there",
    "Fair enough, late challenge",
  ],
  chance: ["So close!", "Unlucky!", "Should've scored there", "Nearly!"],
  general: [
    "Great match so far",
    "This is tense",
    "Quality football on display",
    "Both teams playing well",
    "Loving this game!",
    "Edge of my seat stuff",
    "What a game this is!",
    "Brilliant stuff",
    "Can't look away",
    "This is what football is all about",
    "Top quality match",
    "Anyone know the possession stats?",
    "Come on!",
  ],
};

/* ─── Utility ───────────────────────────────────────────── */

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
