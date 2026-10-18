import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createBracketSlots,
    createWinnerSides,
    getLoser,
    getPlayer,
    selectWinner,
    shuffleTeams
} from '../tournamentLogic.js';

test('createBracketSlots places byes at the bracket ends', () => {
    assert.deepEqual(createBracketSlots(4, 3), [0, null, 1, 2]);
    assert.deepEqual(createBracketSlots(8, 6), [0, null, 1, 2, 3, 4, 5, null]);
});

test('createBracketSlots pairs all teams when there are no byes', () => {
    assert.deepEqual(createBracketSlots(4, 4), [0, 1, 2, 3]);
});

test('createBracketSlots places ranked teams in standard 16-team seed positions', () => {
    assert.deepEqual(
        createBracketSlots(16, 16, 'ranked'),
        [0, 15, 7, 8, 4, 11, 3, 12, 5, 10, 2, 13, 6, 9, 1, 14]
    );
});

test('createBracketSlots gives byes to the highest-ranked teams', () => {
    assert.deepEqual(
        createBracketSlots(16, 12, 'ranked'),
        [0, null, 7, 8, 4, 11, 3, null, 5, 10, 2, null, 6, 9, 1, null]
    );
});

test('shuffleTeams shuffles a copy using the supplied random source', () => {
    const teams = ['A', 'B', 'C', 'D'];
    const shuffledTeams = shuffleTeams(teams, () => 0);

    assert.deepEqual(shuffledTeams, ['B', 'C', 'D', 'A']);
    assert.deepEqual(teams, ['A', 'B', 'C', 'D']);
});

test('createWinnerSides restores picks and automatically advances byes', () => {
    const slots = createBracketSlots(4, 3);

    assert.deepEqual(
        createWinnerSides(4, slots, [[null, 1], [0]]),
        [[0, 1], [0]]
    );
});

test('getPlayer resolves a player through earlier-round winners', () => {
    const state = {
        slotTeams: [0, 1, 2, 3],
        teamNames: ['A', 'B', 'C', 'D'],
        winnerSides: [[0, 1], [null]]
    };

    assert.deepEqual(getPlayer(state, 1, 0, 0), { teamIndex: 0, name: 'A' });
    assert.deepEqual(getPlayer(state, 1, 0, 1), { teamIndex: 3, name: 'D' });
});

test('getPlayer returns null while a previous match has no winner', () => {
    const state = {
        slotTeams: [0, 1, 2, 3],
        teamNames: ['A', 'B', 'C', 'D'],
        winnerSides: [[null, 1], [null]]
    };

    assert.equal(getPlayer(state, 1, 0, 0), null);
});

test('getLoser returns the non-winning player only after a winner is selected', () => {
    const state = {
        slotTeams: [0, 1, 2, 3],
        teamNames: ['A', 'B', 'C', 'D'],
        winnerSides: [[0, 1], [null]]
    };

    assert.deepEqual(getLoser(state, 0, 0), { teamIndex: 1, name: 'B' });
    assert.equal(getLoser(state, 1, 0), null);
});

test('selectWinner clears later outcomes on the affected bracket path', () => {
    const winnerSides = [[0, 1, 1, 0], [0, 1], [0]];

    assert.deepEqual(
        selectWinner(winnerSides, 0, 1, 0),
        [[0, 0, 1, 0], [null, 1], [null]]
    );
    assert.deepEqual(winnerSides, [[0, 1, 1, 0], [0, 1], [0]]);
});
