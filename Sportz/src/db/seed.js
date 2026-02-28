import 'dotenv/config';
import { db } from './db.js';
import { matches, commentary, chatMessages } from './schema.js';

async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        // ── 5 Matches (3 live, 1 scheduled, 1 finished) ────────────
        const now = new Date();
        const [m1, m2, m3, m4, m5] = await db.insert(matches).values([
            {
                sport: 'Football',
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                status: 'live',
                startTime: new Date(now.getTime() - 65 * 60_000),
                endTime:   new Date(now.getTime() + 25 * 60_000),
                homeScore: 2,
                awayScore: 1,
            },
            {
                sport: 'Football',
                homeTeam: 'Real Madrid',
                awayTeam: 'Barcelona',
                status: 'live',
                startTime: new Date(now.getTime() - 30 * 60_000),
                endTime:   new Date(now.getTime() + 60 * 60_000),
                homeScore: 1,
                awayScore: 1,
            },
            {
                sport: 'Football',
                homeTeam: 'Liverpool',
                awayTeam: 'Man United',
                status: 'live',
                startTime: new Date(now.getTime() - 50 * 60_000),
                endTime:   new Date(now.getTime() + 40 * 60_000),
                homeScore: 3,
                awayScore: 0,
            },
            {
                sport: 'Cricket',
                homeTeam: 'India',
                awayTeam: 'Australia',
                status: 'scheduled',
                startTime: new Date(now.getTime() + 120 * 60_000),
                endTime:   new Date(now.getTime() + 600 * 60_000),
                homeScore: 0,
                awayScore: 0,
            },
            {
                sport: 'Basketball',
                homeTeam: 'Lakers',
                awayTeam: 'Warriors',
                status: 'finished',
                startTime: new Date(now.getTime() - 180 * 60_000),
                endTime:   new Date(now.getTime() - 30 * 60_000),
                homeScore: 108,
                awayScore: 102,
            },
        ]).returning();

        console.log('✓ Inserted 5 matches');

        // ── Commentary for each live match (5 each) ────────────────

        // Match 1: Arsenal 2-1 Chelsea (65 min)
        await db.insert(commentary).values([
            { matchId: m1.id, minutes: 1,  sequence: 1, period: '1st half', eventType: 'kickoff',     actor: null,             team: null,      message: "Kick-off at the Emirates! Arsenal get us underway against Chelsea.", tags: ['kickoff'] },
            { matchId: m1.id, minutes: 15, sequence: 2, period: '1st half', eventType: 'goal',        actor: 'Bukayo Saka',    team: 'Arsenal', message: "GOAL! Bukayo Saka cuts inside and curls it into the far corner. Brilliant finish!", tags: ['goal'] },
            { matchId: m1.id, minutes: 33, sequence: 3, period: '1st half', eventType: 'yellow_card', actor: 'Enzo Fernández', team: 'Chelsea', message: "Yellow card for Enzo Fernández — cynical challenge to stop the counter.", tags: ['yellow_card', 'foul'] },
            { matchId: m1.id, minutes: 42, sequence: 4, period: '1st half', eventType: 'goal',        actor: 'Gabriel Jesus',  team: 'Arsenal', message: "GOAL! Gabriel Jesus rises highest and heads home from Ødegaard's delivery!", tags: ['goal', 'header'] },
            { matchId: m1.id, minutes: 58, sequence: 5, period: '2nd half', eventType: 'goal',        actor: 'Cole Palmer',    team: 'Chelsea', message: "GOAL! Cole Palmer pulls one back for Chelsea with a clinical left-foot strike.", tags: ['goal'] },
        ]);

        // Match 2: Real Madrid 1-1 Barcelona (30 min)
        await db.insert(commentary).values([
            { matchId: m2.id, minutes: 1,  sequence: 1, period: '1st half', eventType: 'kickoff',  actor: null,             team: null,          message: "We're underway at the Bernabéu! El Clásico is live.", tags: ['kickoff'] },
            { matchId: m2.id, minutes: 12, sequence: 2, period: '1st half', eventType: 'goal',     actor: 'Vinícius Jr',    team: 'Real Madrid', message: "GOAL! Vinícius Jr dances past two defenders and fires low past the keeper!", tags: ['goal'] },
            { matchId: m2.id, minutes: 18, sequence: 3, period: '1st half', eventType: 'foul',     actor: 'Dani Carvajal',  team: 'Real Madrid', message: "Free kick to Barcelona. Carvajal clips Yamal on the edge of the box.", tags: ['foul'] },
            { matchId: m2.id, minutes: 24, sequence: 4, period: '1st half', eventType: 'goal',     actor: 'Lamine Yamal',   team: 'Barcelona',   message: "GOAL! Lamine Yamal equalises with a stunning free kick that flies into the top corner!", tags: ['goal'] },
            { matchId: m2.id, minutes: 29, sequence: 5, period: '1st half', eventType: 'save',     actor: 'Thibaut Courtois',team: 'Real Madrid', message: "Great save by Courtois! Dives to his left to deny Pedri's curler.", tags: ['save'] },
        ]);

        // Match 3: Liverpool 3-0 Man United (50 min)
        await db.insert(commentary).values([
            { matchId: m3.id, minutes: 1,  sequence: 1, period: '1st half', eventType: 'kickoff', actor: null,              team: null,        message: "Kick-off at Anfield! The atmosphere is electric for this rivalry match.", tags: ['kickoff'] },
            { matchId: m3.id, minutes: 11, sequence: 2, period: '1st half', eventType: 'goal',    actor: 'Mohamed Salah',   team: 'Liverpool', message: "GOAL! Salah receives on the right, cuts inside and smashes it in. Unstoppable!", tags: ['goal'] },
            { matchId: m3.id, minutes: 27, sequence: 3, period: '1st half', eventType: 'goal',    actor: 'Virgil van Dijk', team: 'Liverpool', message: "GOAL! Van Dijk towers above everyone to head home from a corner. 2-0!", tags: ['goal', 'header'] },
            { matchId: m3.id, minutes: 38, sequence: 4, period: '1st half', eventType: 'chance',  actor: 'Diogo Jota',      team: 'Liverpool', message: "Close! Jota's volley rattles the crossbar. Man United are hanging on.", tags: ['chance'] },
            { matchId: m3.id, minutes: 48, sequence: 5, period: '2nd half', eventType: 'goal',    actor: 'Mohamed Salah',   team: 'Liverpool', message: "GOAL! Salah with his second of the night! Quick counter-attack finished clinically.", tags: ['goal'] },
        ]);

        console.log('✓ Inserted 15 commentary entries (5 per live match)');

        // ── Chat messages for each live match (5 each) ─────────────

        await db.insert(chatMessages).values([
            // Match 1 chats
            { matchId: m1.id, author: 'GoalMachine99',   message: 'Saka is on fire today 🔥' },
            { matchId: m1.id, author: 'BlueIsTheColour', message: 'We need to tighten up at the back' },
            { matchId: m1.id, author: 'FootballFan_22',  message: 'What a header by Jesus! Clinical.' },
            { matchId: m1.id, author: 'TacticsNerd',     message: 'Arsenal pressing high, Chelsea can\'t cope' },
            { matchId: m1.id, author: 'MatchdayVibes',   message: 'Palmer making it interesting! Game on 👀' },

            // Match 2 chats
            { matchId: m2.id, author: 'MadridFanatic',   message: 'Vinícius is cooking tonight 🔥' },
            { matchId: m2.id, author: 'CuléForever',     message: 'YAMAL! What a free kick, this kid is special' },
            { matchId: m2.id, author: 'ElClasicoLive',   message: 'Best derby in world football, no debate' },
            { matchId: m2.id, author: 'FootballFan_22',  message: 'Courtois keeping Madrid in this' },
            { matchId: m2.id, author: 'TacticsNerd',     message: 'Both teams leaving gaps at the back, end to end stuff' },

            // Match 3 chats
            { matchId: m3.id, author: 'YNWA_Kop',        message: 'Anfield is BOUNCING! 3-0 get in!!' },
            { matchId: m3.id, author: 'RedDevil_Fan',     message: 'This is painful to watch...' },
            { matchId: m3.id, author: 'GoalMachine99',    message: 'Salah is the best in the league, no question' },
            { matchId: m3.id, author: 'NeutralViewer',    message: 'Liverpool are absolutely ruthless today' },
            { matchId: m3.id, author: 'MatchdayVibes',    message: 'Van Dijk is a monster in the air 💪' },
        ]);

        console.log('✓ Inserted 15 chat messages (5 per live match)');

        console.log('\n🎉 Database seeded successfully!');
        console.log('\nMatches:');
        [m1, m2, m3, m4, m5].forEach(m =>
            console.log(`  - ${m.homeTeam} vs ${m.awayTeam} (${m.status})`)
        );

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

seed();
