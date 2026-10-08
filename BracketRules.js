export const CATEGORY_COUNT_STORAGE_KEY = 'categoryCount';
export const BACKGROUND_PHOTO_STORAGE_KEY = 'tournamentBackgroundPhoto';

export const MIN_CATEGORY_COUNT = 1;
export const MAX_CATEGORY_COUNT = 6;
export const MIN_TEAM_COUNT = 2;
export const MAX_TEAM_COUNT = 64;
export const MAX_CATEGORY_NAME_LENGTH = 60;

export function isValidCategoryCount(value) {
    const count = Number(value);
    return value !== '' &&
        Number.isInteger(count) &&
        count >= MIN_CATEGORY_COUNT &&
        count <= MAX_CATEGORY_COUNT;
}

export function isValidTeamCount(value) {
    const count = Number(value);
    return value !== '' &&
        Number.isInteger(count) &&
        count >= MIN_TEAM_COUNT &&
        count <= MAX_TEAM_COUNT;
}

export function getCategoryLabel(name, number) {
    return name.trim() || `Category ${number}`;
}

export function getNextTabIndex(currentIndex, key, tabCount) {
    if (tabCount <= 0) {
        return null;
    }

    switch (key) {
        case 'ArrowRight':
            return (currentIndex + 1) % tabCount;
        case 'ArrowLeft':
            return (currentIndex - 1 + tabCount) % tabCount;
        case 'Home':
            return 0;
        case 'End':
            return tabCount - 1;
        default:
            return null;
    }
}

export const categoryNameStorageKey = (number) => `categoryName-${number}`;
export const categoryTeamCountStorageKey = (number) => `categoryTeamCount-${number}`;
export const categoryTeamsStorageKey = (number) => `categoryTeams-${number}`;
export const categoryWinnersStorageKey = (number) => `categoryWinners-${number}`;
export const categoryThirdPlaceStorageKey = (number) => `categoryThirdPlace-${number}`;
export const categoryThirdPlaceWinnerStorageKey = (number) => `categoryThirdPlaceWinner-${number}`;
