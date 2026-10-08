import {
    categoryNameStorageKey,
    categoryTeamCountStorageKey,
    categoryWinnersStorageKey,
    CATEGORY_COUNT_STORAGE_KEY,
    getCategoryLabel,
    getNextTabIndex,
    isValidCategoryCount,
    isValidTeamCount,
    MAX_CATEGORY_NAME_LENGTH,
    MAX_TEAM_COUNT,
    MIN_TEAM_COUNT
} from './BracketRules.js';

const categoryCount = sessionStorage.getItem(CATEGORY_COUNT_STORAGE_KEY);

if (!isValidCategoryCount(categoryCount)) {
    window.location.replace('./index.html');
} else {
    const tabList = document.getElementById('categoryTabs');
    const panels = document.getElementById('categoryPanels');
    const result = document.getElementById('result');
    const generateButton = document.getElementById('generateBracketButton');
    const tabs = [];
    const teamCountInputs = [];
    const count = Number(categoryCount);

    result.textContent = `Name each category and enter its number of teams (${MIN_TEAM_COUNT}–${MAX_TEAM_COUNT}).`;

    function updateGenerateButton() {
        generateButton.disabled = !teamCountInputs.every((input) => isValidTeamCount(input.value));
    }

    function activateTab(activeIndex) {
        tabs.forEach((tab, index) => {
            const isActive = index === activeIndex;
            tab.setAttribute('aria-selected', String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
            panels.children[index].hidden = !isActive;
        });
    }

    function createCategory(number, index) {
        const tab = document.createElement('button');
        const panel = document.createElement('section');
        const nameLabel = document.createElement('label');
        const nameInput = document.createElement('input');
        const countLabel = document.createElement('label');
        const countInput = document.createElement('input');
        const storedName = sessionStorage.getItem(categoryNameStorageKey(number)) || '';

        tab.type = 'button';
        tab.id = `category-tab-${number}`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', `category-panel-${number}`);
        tab.textContent = getCategoryLabel(storedName, number);
        tab.addEventListener('click', () => activateTab(index));
        tab.addEventListener('keydown', (event) => {
            const nextIndex = getNextTabIndex(index, event.key, count);
            if (nextIndex === null) {
                return;
            }

            event.preventDefault();
            activateTab(nextIndex);
            tabs[nextIndex].focus();
        });

        panel.id = `category-panel-${number}`;
        panel.className = 'tab-panel';
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        panel.hidden = index !== 0;

        nameLabel.htmlFor = `category-name-${number}`;
        nameLabel.textContent = `Category ${number} name`;

        nameInput.id = `category-name-${number}`;
        nameInput.type = 'text';
        nameInput.maxLength = MAX_CATEGORY_NAME_LENGTH;
        nameInput.placeholder = `Enter category ${number} name`;
        nameInput.value = storedName;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', () => {
            tab.textContent = getCategoryLabel(nameInput.value, number);
            sessionStorage.setItem(categoryNameStorageKey(number), nameInput.value);
        });

        countLabel.htmlFor = `category-team-count-${number}`;
        countLabel.className = 'team-count-label';
        countLabel.textContent = `Number of teams (${MIN_TEAM_COUNT}–${MAX_TEAM_COUNT})`;

        countInput.id = `category-team-count-${number}`;
        countInput.type = 'number';
        countInput.min = String(MIN_TEAM_COUNT);
        countInput.max = String(MAX_TEAM_COUNT);
        countInput.step = '1';
        countInput.placeholder = 'e.g. 8';
        countInput.value = sessionStorage.getItem(categoryTeamCountStorageKey(number)) || '';
        countInput.addEventListener('input', () => {
            sessionStorage.setItem(categoryTeamCountStorageKey(number), countInput.value);
            sessionStorage.removeItem(categoryWinnersStorageKey(number));
            updateGenerateButton();
        });

        panel.append(nameLabel, nameInput, countLabel, countInput);
        tabList.append(tab);
        panels.append(panel);
        tabs.push(tab);
        teamCountInputs.push(countInput);
    }

    for (let index = 0; index < count; index += 1) {
        createCategory(index + 1, index);
    }

    activateTab(0);
    updateGenerateButton();

    generateButton.addEventListener('click', () => {
        updateGenerateButton();
        if (!generateButton.disabled) {
            window.location.href = './tournament.html';
        }
    });
}
