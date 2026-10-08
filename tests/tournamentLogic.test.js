import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createBracketSlots,
    createWinnerSides,
    getLoser,
    getPlayer,
    getRoundName,
    selectWinner
} from '../tournamentLogic.js';

test('createBracketSlots places byes at the bracket ends', () => {
    assert.deepEqual(createBracketSlots(4, 3), [0, null, 1, 2]);
    assert.deepEqual(createBracketSlots(8, 6), [0, null, 1, 2, 3, 4, 5, null]);
});

test('createBracketSlots pairs all teams when there are no byes', () => {
    assert.deepEqual(createBracketSlots(4, 4), [0, 1, 2, 3]);
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

test('getRoundName labels finals and semifinal rounds', () => {
    assert.equal(getRoundName(0, 1), 'Final');
    assert.equal(getRoundName(0, 2), 'Semi-finals');
    assert.equal(getRoundName(1, 2), 'Final');
    assert.equal(getRoundName(0, 3), 'Quarter-finals');
    assert.equal(getRoundName(0, 4), 'Round 1');
});

test('selectWinner clears later outcomes on the affected bracket path', () => {
    const winnerSides = [[0, 1, 1, 0], [0, 1], [0]];

    assert.deepEqual(
        selectWinner(winnerSides, 0, 1, 0),
        [[0, 0, 1, 0], [null, 1], [null]]
    );
    assert.deepEqual(winnerSides, [[0, 1, 1, 0], [0, 1], [0]]);
});
