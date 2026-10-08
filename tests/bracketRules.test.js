import test from 'node:test';
import assert from 'node:assert/strict';
import {
    BACKGROUND_PHOTO_STORAGE_KEY,
    CATEGORY_COUNT_STORAGE_KEY,
    categoryNameStorageKey,
    categoryTeamCountStorageKey,
    categoryTeamsStorageKey,
    categoryThirdPlaceStorageKey,
    categoryThirdPlaceWinnerStorageKey,
    categoryWinnersStorageKey,
    getCategoryLabel,
    getNextTabIndex,
    isValidCategoryCount,
    isValidTeamCount,
    MAX_CATEGORY_COUNT,
    MAX_CATEGORY_NAME_LENGTH,
    MAX_TEAM_COUNT,
    MIN_CATEGORY_COUNT,
    MIN_TEAM_COUNT
} from '../bracketRules.js';

test('exports the shared category and team limits', () => {
    assert.equal(MIN_CATEGORY_COUNT, 1);
    assert.equal(MAX_CATEGORY_COUNT, 6);
    assert.equal(MIN_TEAM_COUNT, 2);
    assert.equal(MAX_TEAM_COUNT, 64);
    assert.equal(MAX_CATEGORY_NAME_LENGTH, 60);
});

test('validates category counts at and within the limits', () => {
    assert.equal(isValidCategoryCount('1'), true);
    assert.equal(isValidCategoryCount(3), true);
    assert.equal(isValidCategoryCount('6'), true);
});

test('rejects invalid category counts', () => {
    for (const value of ['', '0', '7', '2.5', 'abc', ' ']) {
        assert.equal(isValidCategoryCount(value), false, `expected ${JSON.stringify(value)} to be invalid`);
    }
});

test('validates team counts at and within the limits', () => {
    assert.equal(isValidTeamCount('2'), true);
    assert.equal(isValidTeamCount(8), true);
    assert.equal(isValidTeamCount('64'), true);
});

test('rejects invalid team counts', () => {
    for (const value of ['', '1', '65', '2.5', 'abc', ' ']) {
        assert.equal(isValidTeamCount(value), false, `expected ${JSON.stringify(value)} to be invalid`);
    }
});

test('uses a trimmed category name or a numbered fallback label', () => {
    assert.equal(getCategoryLabel('  Open  ', 2), 'Open');
    assert.equal(getCategoryLabel('', 3), 'Category 3');
    assert.equal(getCategoryLabel('   ', 4), 'Category 4');
});

test('calculates wrapped and direct tab navigation indexes', () => {
    assert.equal(getNextTabIndex(0, 'ArrowLeft', 3), 2);
    assert.equal(getNextTabIndex(2, 'ArrowRight', 3), 0);
    assert.equal(getNextTabIndex(1, 'ArrowRight', 3), 2);
    assert.equal(getNextTabIndex(1, 'ArrowLeft', 3), 0);
    assert.equal(getNextTabIndex(2, 'Home', 3), 0);
    assert.equal(getNextTabIndex(0, 'End', 3), 2);
});

test('does not navigate for unsupported keys or an empty tab list', () => {
    assert.equal(getNextTabIndex(0, 'Enter', 3), null);
    assert.equal(getNextTabIndex(0, 'ArrowRight', 0), null);
});

test('defines stable shared session storage keys', () => {
    assert.equal(CATEGORY_COUNT_STORAGE_KEY, 'categoryCount');
    assert.equal(BACKGROUND_PHOTO_STORAGE_KEY, 'tournamentBackgroundPhoto');
    assert.equal(categoryNameStorageKey(2), 'categoryName-2');
    assert.equal(categoryTeamCountStorageKey(2), 'categoryTeamCount-2');
    assert.equal(categoryTeamsStorageKey(2), 'categoryTeams-2');
    assert.equal(categoryWinnersStorageKey(2), 'categoryWinners-2');
    assert.equal(categoryThirdPlaceStorageKey(2), 'categoryThirdPlace-2');
    assert.equal(categoryThirdPlaceWinnerStorageKey(2), 'categoryThirdPlaceWinner-2');
});
