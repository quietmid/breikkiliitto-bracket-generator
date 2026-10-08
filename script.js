import { isValidCategoryCount } from './BracketRules.js';

const MAX_BACKGROUND_PHOTO_SIZE = 24_000_000;
const ALLOWED_BACKGROUND_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function isStartButtonDisabled(categoryCount, isPhotoProcessing) {
    return !isValidCategoryCount(categoryCount) || isPhotoProcessing;
}

export function getBackgroundPhotoValidationMessage(file) {
    if (!ALLOWED_BACKGROUND_PHOTO_TYPES.includes(file.type)) {
        return 'Choose a JPEG, PNG, or WebP image.';
    }
    if (file.size >= MAX_BACKGROUND_PHOTO_SIZE) {
        return 'Choose an image smaller than 24 MB.';
    }
    return null;
}

export function getPhotoProcessingErrorMessage(error) {
    if (error && typeof error === 'object' && error.name === 'QuotaExceededError') {
        return 'This photo exceeds available browser storage. Try a smaller image.';
    }
    return 'Could not apply this photo. Try another image.';
}

export function getInitialPhotoStatus(hasSavedPhoto) {
    return hasSavedPhoto ? 'A background photo is ready for this session.' : '';
}
