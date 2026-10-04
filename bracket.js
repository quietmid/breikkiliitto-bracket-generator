const categoryCount = Number(sessionStorage.getItem('categoryCount'));

if (!Number.isInteger(categoryCount) || categoryCount < 1 || categoryCount > 6) {
    window.location.replace('./index.html');
} else {
    const tabs = document.getElementById('categoryTabs');
    const panels = document.getElementById('categoryPanels');
    const result = document.getElementById('result');
    const generateButton = document.getElementById('generateBracketButton');
    const tabButtons = [];
    const teamCountInputs = [];

    result.textContent = `Name each category and enter its number of teams (2–64).`;

    function updateGenerateButton() {
        generateButton.disabled = teamCountInputs.some((teamCountInput) => {
            const count = Number(teamCountInput.value);
            return teamCountInput.value === '' || !Number.isInteger(count) || count < 2 || count > 64;
        });
    }

    function activateTab(index) {
        tabButtons.forEach((tab, tabIndex) => {
            const selected = tabIndex === index;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
            panels.children[tabIndex].hidden = !selected;
        });
    }

    for (let index = 0; index < categoryCount; index += 1) {
        const number = index + 1;
        const tab = document.createElement('button');
        const panel = document.createElement('section');
        const nameLabel = document.createElement('label');
        const nameInput = document.createElement('input');
        const countLabel = document.createElement('label');
        const countInput = document.createElement('input');
        const storedName = sessionStorage.getItem(`categoryName-${number}`) || '';
        const storedTeamCount = sessionStorage.getItem(`categoryTeamCount-${number}`) || '';

        tab.type = 'button';
        tab.id = `category-tab-${number}`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', `category-panel-${number}`);
        tab.textContent = storedName || `Category ${number}`;
        tab.addEventListener('click', () => activateTab(index));
        tab.addEventListener('keydown', (event) => {
            let nextIndex;

            if (event.key === 'ArrowRight') {
                nextIndex = (index + 1) % categoryCount;
            } else if (event.key === 'ArrowLeft') {
                nextIndex = (index - 1 + categoryCount) % categoryCount;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = categoryCount - 1;
            } else {
                return;
            }

            event.preventDefault();
            activateTab(nextIndex);
            tabButtons[nextIndex].focus();
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
        nameInput.maxLength = 60;
        nameInput.placeholder = `Enter category ${number} name`;
        nameInput.value = storedName;
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', () => {
            const name = nameInput.value.trim();
            tab.textContent = name || `Category ${number}`;
            sessionStorage.setItem(`categoryName-${number}`, nameInput.value);
        });

        countLabel.htmlFor = `category-team-count-${number}`;
        countLabel.className = 'team-count-label';
        countLabel.textContent = 'Number of teams (2–64)';

        countInput.id = `category-team-count-${number}`;
        countInput.type = 'number';
        countInput.min = '2';
        countInput.max = '64';
        countInput.step = '1';
        countInput.placeholder = 'e.g. 8';
        countInput.value = storedTeamCount;
        countInput.addEventListener('input', () => {
            sessionStorage.setItem(`categoryTeamCount-${number}`, countInput.value);
            sessionStorage.removeItem(`categoryWinners-${number}`);
            updateGenerateButton();
        });

        panel.append(nameLabel, nameInput, countLabel, countInput);
        tabs.append(tab);
        panels.append(panel);
        tabButtons.push(tab);
        teamCountInputs.push(countInput);
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
