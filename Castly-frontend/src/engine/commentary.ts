/**
 * Professional Commentary Generator
 *
 * Generates realistic, broadcast-quality commentary text
 * for various match events. System-generated — NOT fake users.
 */

export type EventType =
  | "possession"
  | "pass"
  | "foul"
  | "shot"
  | "corner"
  | "save"
  | "chance"
  | "tackle"
  | "goal"
  | "yellow_card"
  | "red_card"
  | "kickoff"
  | "halftime"
  | "substitution"
  | "offside";

export interface CommentaryContext {
  team: string;
  otherTeam: string;
  player: string;
  minute: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

/* ─── Templates (broadcast tone) ────────────────────────── */

const T: Record<EventType, string[]> = {
  possession: [
    "{team} building pressure on the right flank.",
    "{team} maintaining possession in the midfield.",
    "{team} circulating the ball patiently, looking for a way through.",
    "Good ball retention from {team} here.",
    "{team} looking to exploit space on the left wing.",
    "Patient buildup from {team}. They're probing for an opening.",
    "{team} regain possession in the final third.",
    "Comfortable possession from {team}. Controlling the tempo.",
    "{team} dominating the ball in this phase of play.",
    "{team} working the ball across the back line.",
  ],
  pass: [
    "Lovely through ball from {player}. {team} advancing.",
    "{player} sprays the ball out wide — good vision.",
    "Quick one-two between {player} and a teammate. {team} moving well.",
    "Excellent diagonal by {player}. Switches the point of attack.",
    "{player} picks out a pass into the channels for {team}.",
    "Neat interplay in the {team} half. They're pushing forward.",
  ],
  foul: [
    "Foul by {player}. Free kick to {otherTeam}.",
    "{player} caught with a late challenge. Free kick awarded.",
    "The referee blows for a foul on {player}.",
    "Cynical foul by {player} to stop the counter-attack.",
    "{player} clips the attacker's heels. Free kick in a good area for {otherTeam}.",
  ],
  shot: [
    "Shot on target by {player}. The keeper holds it comfortably.",
    "{player} lets fly from distance — blocked by the defense.",
    "Good effort by {player}. Dragged just wide of the far post.",
    "{player} strikes from the edge of the box — saved.",
    "Powerful drive from {player}. Forces a routine save.",
  ],
  corner: [
    "Corner to {team}. Good delivery expected.",
    "{team} win a corner. The set piece is floated in.",
    "Corner kick for {team}. Players crowding the box.",
    "Short corner played by {team}. They work it along the byline.",
  ],
  save: [
    "Wonderful save! The keeper denies {player} from close range.",
    "Outstanding reflexes from the goalkeeper to keep out {player}'s effort.",
    "What a stop! {player}'s header is tipped over the bar.",
    "Full stretch save. {player} can't believe it stayed out.",
  ],
  chance: [
    "Close! {player} strikes from the edge of the box but it's just over.",
    "That was so close! {player} just couldn't get enough on it.",
    "{player} flashes a header across goal. Inches away.",
    "Big chance for {team}! {player} fires wide from a great position.",
    "Half-chance for {player} but the angle was too tight.",
  ],
  tackle: [
    "Crunching tackle by {player}! {team} win the ball back.",
    "Well-timed challenge from {player}. Clean as you like.",
    "{player} dispossesses the attacker with a superb sliding tackle.",
    "Strong defensive work from {player} to cut out the danger.",
  ],
  goal: [
    "GOAL! {player} scores for {team}! Magnificent finish! {homeTeam} {homeScore}-{awayScore} {awayTeam}.",
    "GOAL! {player} finds the back of the net! {homeTeam} {homeScore}-{awayScore} {awayTeam}.",
    "It's in! {player} with a clinical strike for {team}! {homeTeam} {homeScore}-{awayScore} {awayTeam}.",
    "GOAL! What a moment! {player} makes it {homeTeam} {homeScore}-{awayScore} {awayTeam}!",
    "Brilliant goal by {player}! {homeTeam} {homeScore}-{awayScore} {awayTeam}!",
  ],
  yellow_card: [
    "Yellow card shown to {player} for a reckless challenge.",
    "{player} goes into the referee's notebook. Caution for {team}.",
    "Booking for {player}. The referee had no choice there.",
    "Yellow card. {player} will need to be careful from here on.",
  ],
  red_card: [
    "RED CARD! {player} is sent off! {team} down to ten men.",
    "Straight red for {player}! A moment of madness.",
    "{player} receives a second yellow — that's a red card. {team} are a man short.",
  ],
  kickoff: [
    "Kick-off! The match is underway.",
    "And we're off! The referee gets the match started.",
  ],
  halftime: [
    "Half-time. {homeTeam} {homeScore}-{awayScore} {awayTeam}.",
    "The referee blows for half-time. {homeTeam} {homeScore}-{awayScore} {awayTeam} at the break.",
  ],
  substitution: [
    "Substitution for {team}. Fresh legs coming on.",
    "Tactical change for {team}. The manager looking for a new dynamic.",
    "{team} make a substitution. New energy entering the pitch.",
  ],
  offside: [
    "{player} is caught offside. The flag goes up.",
    "Offside against {player}. Good call by the linesman.",
    "Good run by {player} but the flag is up. Marginal offside.",
  ],
};

/* ─── Generator ─────────────────────────────────────────── */

function fill(template: string, ctx: CommentaryContext): string {
  return template
    .replace(/\{team\}/g, ctx.team)
    .replace(/\{otherTeam\}/g, ctx.otherTeam)
    .replace(/\{player\}/g, ctx.player)
    .replace(/\{minute\}/g, String(ctx.minute))
    .replace(/\{homeTeam\}/g, ctx.homeTeam)
    .replace(/\{awayTeam\}/g, ctx.awayTeam)
    .replace(/\{homeScore\}/g, String(ctx.homeScore))
    .replace(/\{awayScore\}/g, String(ctx.awayScore));
}

export function generateCommentaryText(
  eventType: EventType,
  ctx: CommentaryContext,
): string {
  const templates = T[eventType] ?? T.possession;
  const tpl = templates[Math.floor(Math.random() * templates.length)];
  return fill(tpl, ctx);
}
