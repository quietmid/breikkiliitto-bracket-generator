import {
    categoryNameStorageKey,
    categoryTeamCountStorageKey,
    categoryTeamModeStorageKey,
    categoryTeamsStorageKey,
    categoryThirdPlaceWinnerStorageKey,
    categoryWinnersStorageKey,
    CATEGORY_COUNT_STORAGE_KEY,
    getCategoryLabel,
    getNextTabIndex,
    isValidCategoryCount,
    isValidTeamCount,
    MAX_CATEGORY_NAME_LENGTH,
    MAX_TEAM_COUNT,
    MIN_TEAM_COUNT
} from './bracketRules.js';
import { shuffleTeams } from './tournamentLogic.js';

const categoryCount = sessionStorage.getItem(CATEGORY_COUNT_STORAGE_KEY);

if (!isValidCategoryCount(categoryCount)) {
    window.location.replace('./index.html');
} else {
    const tabList = document.getElementById('categoryTabs');
    const panels = document.getElementById('categoryPanels');
    const result = document.getElementById('result');
    const generateButton = document.getElementById('generateBracketButton');
    const tabs = [];
    const categories = [];
    const count = Number(categoryCount);

    result.textContent = `Name each category and enter its number of teams (${MIN_TEAM_COUNT}–${MAX_TEAM_COUNT}).`;

    function updateGenerateButton() {
        generateButton.disabled = !categories.every((category) => (
            isValidTeamCount(category.countInput.value) &&
            (category.modeSelect.value === 'manual' ||
                (category.rosterInputs.length === Number(category.countInput.value) &&
                    category.rosterInputs.every((input) => input.value.trim() !== '')))
        ));
    }

    function activateTab(activeIndex) {
        tabs.forEach((tab, index) => {
            const isActive = index === activeIndex;
            tab.setAttribute('aria-selected', String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
            panels.children[index].hidden = !isActive;
        });
    }

    function clearCategoryOutcomes(number) {
        sessionStorage.removeItem(categoryWinnersStorageKey(number));
        sessionStorage.removeItem(categoryThirdPlaceWinnerStorageKey(number));
    }

    function createCategoryTab(category) {
        const tab = document.createElement('button');
        const storedName = sessionStorage.getItem(categoryNameStorageKey(category.number)) || '';

        tab.type = 'button';
        tab.id = `category-tab-${category.number}`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', `category-panel-${category.number}`);
        tab.textContent = getCategoryLabel(storedName, category.number);
        tab.addEventListener('click', () => activateTab(category.index));
        tab.addEventListener('keydown', (event) => {
            const nextIndex = getNextTabIndex(category.index, event.key, count);
            if (nextIndex === null) {
                return;
            }

            event.preventDefault();
            activateTab(nextIndex);
            tabs[nextIndex].focus();
        });

        return tab;
    }

    function createCategoryNameFields(category) {
        const nameLabel = document.createElement('label');
        const nameInput = document.createElement('input');
        const storedName = sessionStorage.getItem(categoryNameStorageKey(category.number)) || '';

        nameLabel.htmlFor = `category-name-${category.number}`;
        nameLabel.textContent = `Category ${category.number} name`;

        nameInput.id = nameLabel.htmlFor;
        nameInput.type = 'text';
        nameInput.maxLength = MAX_CATEGORY_NAME_LENGTH;
        nameInput.placeholder = `Enter category ${category.number} name`;
        nameInput.value = storedName;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', () => {
            category.tab.textContent = getCategoryLabel(nameInput.value, category.number);
            sessionStorage.setItem(categoryNameStorageKey(category.number), nameInput.value);
        });

        return [nameLabel, nameInput];
    }

    function createTeamCountFields(category) {
        const countLabel = document.createElement('label');
        const countInput = document.createElement('input');

        countLabel.htmlFor = `category-team-count-${category.number}`;
        countLabel.className = 'team-count-label';
        countLabel.textContent = `Number of teams (${MIN_TEAM_COUNT}–${MAX_TEAM_COUNT})`;

        countInput.id = countLabel.htmlFor;
        countInput.type = 'number';
        countInput.min = String(MIN_TEAM_COUNT);
        countInput.max = String(MAX_TEAM_COUNT);
        countInput.step = '1';
        countInput.placeholder = 'e.g. 8';
        countInput.value = sessionStorage.getItem(categoryTeamCountStorageKey(category.number)) || '';
        countInput.addEventListener('input', () => {
            sessionStorage.setItem(categoryTeamCountStorageKey(category.number), countInput.value);
            clearCategoryOutcomes(category.number);
            updateCategoryRoster(category);
            updateGenerateButton();
        });

        category.countInput = countInput;
        return [countLabel, countInput];
    }

    function createTeamModeFields(category) {
        const modeLabel = document.createElement('label');
        const modeSelect = document.createElement('select');

        modeLabel.htmlFor = `category-team-mode-${category.number}`;
        modeLabel.className = 'team-mode-label';
        modeLabel.textContent = 'Team entry mode';

        modeSelect.id = modeLabel.htmlFor;
        modeSelect.className = 'team-mode-select';
        [
            ['ranked', 'Ranked'],
            ['random', 'Random'],
            ['manual', 'Manual']
        ].forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            modeSelect.append(option);
        });

        const storedMode = sessionStorage.getItem(categoryTeamModeStorageKey(category.number));
        modeSelect.value = ['ranked', 'random', 'manual'].includes(storedMode)
            ? storedMode
            : 'manual';
        modeSelect.addEventListener('change', () => {
            sessionStorage.setItem(categoryTeamModeStorageKey(category.number), modeSelect.value);
            clearCategoryOutcomes(category.number);
            updateCategoryRoster(category);
            updateGenerateButton();
        });

        category.modeSelect = modeSelect;
        return [modeLabel, modeSelect];
    }

    function createTeamRoster(category) {
        const rosterContainer = document.createElement('div');
        rosterContainer.className = 'team-roster';
        rosterContainer.id = `category-team-roster-${category.number}`;
        category.rosterContainer = rosterContainer;
        category.rosterInputs = [];
        return rosterContainer;
    }

    function createRosterTeamFields(category, teamIndex, storedTeams) {
        const teamLabel = document.createElement('label');
        const teamInput = document.createElement('input');
        const teamNumber = teamIndex + 1;
        const isRanked = category.modeSelect.value === 'ranked';

        teamLabel.htmlFor = `category-team-name-${category.number}-${teamNumber}`;
        teamLabel.textContent = isRanked ? `Seed ${teamNumber}` : `Team ${teamNumber}`;

        teamInput.id = teamLabel.htmlFor;
        teamInput.type = 'text';
        teamInput.maxLength = 60;
        teamInput.autocomplete = 'off';
        teamInput.value = storedTeams[teamIndex] || '';
        teamInput.addEventListener('input', () => {
            clearCategoryOutcomes(category.number);
            sessionStorage.setItem(
                categoryTeamsStorageKey(category.number),
                JSON.stringify(category.rosterInputs.map((input) => input.value))
            );
            updateGenerateButton();
        });

        return [teamLabel, teamInput];
    }

    function updateCategoryRoster(category) {
        const teamCount = isValidTeamCount(category.countInput.value)
            ? Number(category.countInput.value)
            : 0;
        const mode = category.modeSelect.value;
        const rosterContainer = category.rosterContainer;

        rosterContainer.replaceChildren();
        category.rosterInputs = [];
        rosterContainer.hidden = mode === 'manual' || teamCount === 0;

        if (rosterContainer.hidden) {
            return;
        }

        const legend = document.createElement('h3');
        legend.className = 'team-roster-heading';
        legend.textContent = mode === 'ranked'
            ? 'Team names in seed order (first name is seed 1)'
            : 'Team names to pair randomly';
        rosterContainer.append(legend);

        const storedTeams = JSON.parse(
            sessionStorage.getItem(categoryTeamsStorageKey(category.number)) || '[]'
        );

        for (let teamIndex = 0; teamIndex < teamCount; teamIndex += 1) {
            const fields = createRosterTeamFields(category, teamIndex, storedTeams);
            rosterContainer.append(...fields);
            category.rosterInputs.push(fields[1]);
        }
    }

    function createCategoryPanel(category) {
        const panel = document.createElement('section');

        panel.id = `category-panel-${category.number}`;
        panel.className = 'tab-panel';
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', category.tab.id);
        panel.hidden = category.index !== 0;

        const fields = [
            ...createCategoryNameFields(category),
            ...createTeamCountFields(category),
            ...createTeamModeFields(category),
            createTeamRoster(category)
        ];
        panel.append(...fields);
        return panel;
    }

    function createCategory(number, index) {
        const category = { number, index, rosterInputs: [] };
        category.tab = createCategoryTab(category);
        category.panel = createCategoryPanel(category);

        tabList.append(category.tab);
        panels.append(category.panel);
        tabs.push(category.tab);
        categories.push(category);
        updateCategoryRoster(category);
    }

    for (let index = 0; index < count; index += 1) {
        createCategory(index + 1, index);
    }

    activateTab(0);
    updateGenerateButton();

    generateButton.addEventListener('click', () => {
        updateGenerateButton();
        if (!generateButton.disabled) {
            categories.forEach((category) => {
                if (category.modeSelect.value === 'manual') {
                    return;
                }

                const names = category.rosterInputs.map((input) => input.value.trim());
                sessionStorage.setItem(
                    categoryTeamsStorageKey(category.number),
                    JSON.stringify(category.modeSelect.value === 'random' ? shuffleTeams(names) : names)
                );
            });
            window.location.href = './tournament.html';
        }
    });
}
