import {
    BACKGROUND_PHOTO_STORAGE_KEY,
    CATEGORY_STORAGE_KEY,
    getBackgroundPhotoValidationMessage,
    getInitialPhotoStatus,
    getPhotoProcessingErrorMessage,
    isStartButtonDisabled
} from './script.js';

const input = document.getElementById('categories');
const button = document.getElementById('startButton');
const backgroundPhotoFile = document.getElementById('backgroundPhotoFile');
const removeBackgroundPhotoButton = document.getElementById('removeBackgroundPhotoButton');
const backgroundPhotoStatus = document.getElementById('backgroundPhotoStatus');
let isPhotoProcessing = false;

function updateStartButton() {
    button.disabled = isStartButtonDisabled(input.value, isPhotoProcessing);
}

function updatePhotoStatus(message) {
    backgroundPhotoStatus.textContent = message;
    removeBackgroundPhotoButton.hidden = !sessionStorage.getItem(BACKGROUND_PHOTO_STORAGE_KEY);
}

function compressBackgroundPhoto(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const maxDimension = 1920;
            const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);
            const context = canvas.getContext('2d');

            if (!context) {
                reject(new Error('Could not process this image.'));
                return;
            }

            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not read this image.'));
        };
        image.src = objectUrl;
    });
}

input.addEventListener('input', updateStartButton);

backgroundPhotoFile.addEventListener('change', async () => {
    const [file] = backgroundPhotoFile.files;
    if (!file) {
        return;
    }

    const validationMessage = getBackgroundPhotoValidationMessage(file);
    if (validationMessage) {
        updatePhotoStatus(validationMessage);
        backgroundPhotoFile.value = '';
        return;
    }

    isPhotoProcessing = true;
    updateStartButton();
    backgroundPhotoStatus.textContent = 'Processing photo…';
    try {
        const photoDataUrl = await compressBackgroundPhoto(file);
        sessionStorage.setItem(BACKGROUND_PHOTO_STORAGE_KEY, photoDataUrl);
        updatePhotoStatus(`Background photo ready: ${file.name}`);
    } catch (error) {
        updatePhotoStatus(getPhotoProcessingErrorMessage(error));
    } finally {
        isPhotoProcessing = false;
        backgroundPhotoFile.value = '';
        updateStartButton();
    }
});

removeBackgroundPhotoButton.addEventListener('click', () => {
    sessionStorage.removeItem(BACKGROUND_PHOTO_STORAGE_KEY);
    updatePhotoStatus('Background photo removed.');
});

updatePhotoStatus(getInitialPhotoStatus(Boolean(sessionStorage.getItem(BACKGROUND_PHOTO_STORAGE_KEY))));
updateStartButton();

button.addEventListener('click', () => {
    updateStartButton();
    if (button.disabled) {
        return;
    }
    sessionStorage.setItem(CATEGORY_STORAGE_KEY, input.value);
    window.location.href = 'bracket.html';
});
