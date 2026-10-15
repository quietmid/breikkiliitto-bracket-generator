const THEME_STORAGE_KEY = 'colorTheme';
const THEMES = ['light', 'dark', 'blue-mint', 'red-black', 'blue-shades'];
const themeSelector = document.getElementById('themeSelector');

if (themeSelector) {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = THEMES.includes(storedTheme) ? storedTheme : 'light';

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        themeSelector.value = theme;
    }

    applyTheme(initialTheme);
    themeSelector.addEventListener('change', () => {
        const selectedTheme = themeSelector.value;
        if (!THEMES.includes(selectedTheme)) {
            return;
        }
        localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
        applyTheme(selectedTheme);
    });
}
