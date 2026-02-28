import 'dotenv/config';
import { db } from './db.js';
import { matches, commentary } from './schema.js';

async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        // Insert sample matches
        const [match1, match2, match3] = await db.insert(matches).values([
            {
                sport: 'Football',
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                status: 'live',
                startTime: new Date('2026-02-28T15:00:00Z'),
                endTime: new Date('2026-02-28T17:00:00Z'),
                homeScore: 2,
                awayScore: 1,
            },
            {
                sport: 'Cricket',
                homeTeam: 'India',
                awayTeam: 'Australia',
                status: 'scheduled',
                startTime: new Date('2026-03-01T10:00:00Z'),
                endTime: new Date('2026-03-01T18:00:00Z'),
                homeScore: 0,
                awayScore: 0,
            },
            {
                sport: 'Basketball',
                homeTeam: 'Lakers',
                awayTeam: 'Warriors',
                status: 'finished',
                startTime: new Date('2026-02-27T20:00:00Z'),
                endTime: new Date('2026-02-27T22:30:00Z'),
                homeScore: 108,
                awayScore: 102,
            },
        ]).returning();

        console.log('✓ Inserted 3 matches');

        // Insert sample commentary for match 1 (Arsenal vs Chelsea)
        await db.insert(commentary).values([
            {
                matchId: match1.id,
                minutes: 1,
                sequence: 1,
                period: '1st half',
                eventType: 'kickoff',
                actor: null,
                team: null,
                message: 'Kick-off! Arsenal get us underway.',
                metadata: { stadium: 'Emirates Stadium', attendance: 60000 },
                tags: ['kickoff'],
            },
            {
                matchId: match1.id,
                minutes: 15,
                sequence: 2,
                period: '1st half',
                eventType: 'goal',
                actor: 'Bukayo Saka',
                team: 'Arsenal',
                message: 'GOAL! Bukayo Saka opens the scoring with a brilliant finish!',
                metadata: { assistBy: 'Martin Ødegaard', type: 'right_foot' },
                tags: ['goal', 'shot'],
            },
            {
                matchId: match1.id,
                minutes: 28,
                sequence: 3,
                period: '1st half',
                eventType: 'yellow_card',
                actor: 'Enzo Fernández',
                team: 'Chelsea',
                message: 'Yellow card shown to Enzo Fernández for a tactical foul.',
                metadata: { reason: 'tactical_foul' },
                tags: ['yellow_card', 'foul'],
            },
            {
                matchId: match1.id,
                minutes: 42,
                sequence: 4,
                period: '1st half',
                eventType: 'goal',
                actor: 'Gabriel Jesus',
                team: 'Arsenal',
                message: 'GOAL! Gabriel Jesus doubles Arsenal\'s lead just before halftime!',
                metadata: { assistBy: 'Bukayo Saka', type: 'header' },
                tags: ['goal', 'header'],
            },
            {
                matchId: match1.id,
                minutes: 45,
                sequence: 5,
                period: '1st half',
                eventType: 'halftime',
                actor: null,
                team: null,
                message: 'Half-time: Arsenal 2-0 Chelsea',
                metadata: { possession: { Arsenal: 58, Chelsea: 42 } },
                tags: ['halftime'],
            },
            {
                matchId: match1.id,
                minutes: 62,
                sequence: 6,
                period: '2nd half',
                eventType: 'goal',
                actor: 'Cole Palmer',
                team: 'Chelsea',
                message: 'GOAL! Cole Palmer pulls one back for Chelsea!',
                metadata: { assistBy: 'Raheem Sterling', type: 'left_foot' },
                tags: ['goal', 'shot'],
            },
        ]);

        console.log('✓ Inserted 6 commentary entries for match 1');

        // Insert sample commentary for match 3 (Lakers vs Warriors - finished)
        await db.insert(commentary).values([
            {
                matchId: match3.id,
                minutes: 1,
                sequence: 1,
                period: '1st quarter',
                eventType: 'tipoff',
                actor: null,
                team: null,
                message: 'Tip-off! Game underway at Crypto.com Arena.',
                metadata: { venue: 'Crypto.com Arena' },
                tags: ['tipoff'],
            },
            {
                matchId: match3.id,
                minutes: 5,
                sequence: 2,
                period: '1st quarter',
                eventType: 'score',
                actor: 'LeBron James',
                team: 'Lakers',
                message: 'LeBron James with a powerful dunk! Lakers 12-8.',
                metadata: { points: 2, type: 'dunk' },
                tags: ['score', 'dunk'],
            },
            {
                matchId: match3.id,
                minutes: 48,
                sequence: 3,
                period: '4th quarter',
                eventType: 'final',
                actor: null,
                team: null,
                message: 'Final: Lakers defeat Warriors 108-102!',
                metadata: { topScorer: { player: 'LeBron James', points: 32 } },
                tags: ['final', 'game_end'],
            },
        ]);

        console.log('✓ Inserted 3 commentary entries for match 3');

        console.log('🎉 Database seeded successfully!');
        console.log('\nSample data:');
        console.log(`  - Match 1: ${match1.homeTeam} vs ${match1.awayTeam} (${match1.status})`);
        console.log(`  - Match 2: ${match2.homeTeam} vs ${match2.awayTeam} (${match2.status})`);
        console.log(`  - Match 3: ${match3.homeTeam} vs ${match3.awayTeam} (${match3.status})`);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

seed();
