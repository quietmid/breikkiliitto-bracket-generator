const input = document.getElementById('categories');
const button = document.getElementById('startButton');
const backgroundPhotoFile = document.getElementById('backgroundPhotoFile');
const removeBackgroundPhotoButton = document.getElementById('removeBackgroundPhotoButton');
const backgroundPhotoStatus = document.getElementById('backgroundPhotoStatus');
let isPhotoProcessing = false;

function updateStartButton() {
    const value = Number(input.value);
    const isValid = input.value !== "" && Number.isInteger(value) && value > 0 && value < 7;
    button.disabled = !isValid || isPhotoProcessing;
}

function updatePhotoStatus(message) {
    backgroundPhotoStatus.textContent = message;
    removeBackgroundPhotoButton.hidden = !sessionStorage.getItem('tournamentBackgroundPhoto');
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

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        updatePhotoStatus('Choose a JPEG, PNG, or WebP image.');
        backgroundPhotoFile.value = '';
        return;
    }
    if (file.size >= 24_000_000) {
        updatePhotoStatus('Choose an image smaller than 24 MB.');
        backgroundPhotoFile.value = '';
        return;
    }

    isPhotoProcessing = true;
    updateStartButton();
    backgroundPhotoStatus.textContent = 'Processing photo…';
    try {
        const photoDataUrl = await compressBackgroundPhoto(file);
        sessionStorage.setItem('tournamentBackgroundPhoto', photoDataUrl);
        updatePhotoStatus(`Background photo ready: ${file.name}`);
    } catch (error) {
        updatePhotoStatus(error instanceof DOMException && error.name === 'QuotaExceededError'
            ? 'This photo exceeds available browser storage. Try a smaller image.'
            : 'Could not apply this photo. Try another image.');
    } finally {
        isPhotoProcessing = false;
        backgroundPhotoFile.value = '';
        updateStartButton();
    }
});

removeBackgroundPhotoButton.addEventListener('click', () => {
    sessionStorage.removeItem('tournamentBackgroundPhoto');
    updatePhotoStatus('Background photo removed.');
});

if (sessionStorage.getItem('tournamentBackgroundPhoto')) {
    updatePhotoStatus('A background photo is ready for this session.');
}
updateStartButton();

button.addEventListener('click', () => {
    updateStartButton();
    if (button.disabled) {
        return;
    }
    const categoryCount = input.value;
    // Save it for the next page (using sessionStorage, which works fine in plain JS)
    sessionStorage.setItem('categoryCount', categoryCount);
    // Navigate to the bracket page
    window.location.href = 'bracket.html';
});