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
    isValidTeamCount
} from './bracketRules.js';
import {
    createBracketSlots,
    createWinnerSides,
    getLoser,
    getPlayer,
    getRoundName,
    selectWinner
} from './tournamentLogic.js';

const storedCategoryCount = sessionStorage.getItem(CATEGORY_COUNT_STORAGE_KEY);

if (!isValidCategoryCount(storedCategoryCount)) {
    window.location.replace('./index.html');
} else {
    const categoryCount = Number(storedCategoryCount);
    const categories = Array.from({ length: categoryCount }, (_, index) => {
        const number = index + 1;
        return {
            number,
            name: getCategoryLabel(sessionStorage.getItem(categoryNameStorageKey(number)) || '', number),
            teamCount: Number(sessionStorage.getItem(categoryTeamCountStorageKey(number)))
        };
    });

    if (categories.some(({ teamCount }) => !isValidTeamCount(teamCount))) {
        window.location.replace('./bracket.html');
    } else {
        const tabs = document.getElementById('tournamentTabs');
        const title = document.getElementById('tournamentTitle');
        const summary = document.getElementById('tournamentSummary');
        const roundsElement = document.getElementById('bracketRounds');
        const leftBracket = document.getElementById('leftBracket');
        const finalMatch = document.getElementById('finalMatch');
        const rightBracket = document.getElementById('rightBracket');
        const thirdPlaceToggle = document.getElementById('thirdPlaceToggle');
        const thirdPlaceRound = document.getElementById('thirdPlaceRound');
        const thirdPlaceTeams = [0, 1].map((sideIndex) => (
            document.getElementById(`thirdPlaceTeam${sideIndex}`)
        ));
        const thirdPlaceChoices = [0, 1].map((sideIndex) => (
            document.getElementById(`thirdPlaceChoice${sideIndex}`)
        ));
        const tabButtons = [];
        let activeCategoryIndex = 0;
        let teamNames = [];
        let winnerSides = [];
        let slotTeams = [];
        let roundCount = 0;
        let includeThirdPlace = false;
        let thirdPlaceWinnerSide = null;
        const bracketState = () => ({ slotTeams, teamNames, winnerSides });

        const backgroundPhoto = sessionStorage.getItem(BACKGROUND_PHOTO_STORAGE_KEY);
        if (backgroundPhoto) {
            document.body.classList.add('has-background-photo');
            document.body.style.setProperty(
                '--tournament-background-photo',
                `url(${JSON.stringify(backgroundPhoto)})`
            );
        }

        function saveWinners() {
            sessionStorage.setItem(
                categoryWinnersStorageKey(categories[activeCategoryIndex].number),
                JSON.stringify(winnerSides)
            );
        }

        function saveThirdPlace() {
            const categoryNumber = categories[activeCategoryIndex].number;
            sessionStorage.setItem(categoryThirdPlaceStorageKey(categoryNumber), String(includeThirdPlace));
            sessionStorage.setItem(
                categoryThirdPlaceWinnerStorageKey(categoryNumber),
                thirdPlaceWinnerSide === null ? '' : String(thirdPlaceWinnerSide)
            );
        }

        function updateThirdPlace() {
            const hasThirdPlaceMatch = includeThirdPlace && categories[activeCategoryIndex].teamCount >= 4;
            thirdPlaceRound.hidden = !hasThirdPlaceMatch;
            thirdPlaceToggle.checked = includeThirdPlace;
            thirdPlaceToggle.disabled = categories[activeCategoryIndex].teamCount < 4;

            if (!hasThirdPlaceMatch) {
                return;
            }

            const semifinalRound = roundCount - 2;
            const semifinalLosers = [
                getLoser(bracketState(), semifinalRound, 0),
                getLoser(bracketState(), semifinalRound, 1)
            ];

            semifinalLosers.forEach((team, sideIndex) => {
                const teamName = team
                    ? (team.name || `Team ${team.teamIndex + 1}`)
                    : 'TBD';
                const choice = thirdPlaceChoices[sideIndex];
                thirdPlaceTeams[sideIndex].textContent = teamName;
                thirdPlaceTeams[sideIndex].classList.toggle(
                    'is-winner',
                    thirdPlaceWinnerSide === sideIndex
                );
                choice.disabled = !semifinalLosers[0] || !semifinalLosers[1] ||
                    !semifinalLosers[0].name.trim() || !semifinalLosers[1].name.trim();
                choice.textContent = thirdPlaceWinnerSide === sideIndex ? '✓' : '○';
                choice.setAttribute(
                    'aria-label',
                    `${thirdPlaceWinnerSide === sideIndex ? 'Third place' : 'Select'} ${teamName}`
                );
            });
        }

        function updateBracket() {
            roundsElement.querySelectorAll('[data-round]').forEach((roundElement) => {
                const roundIndex = Number(roundElement.dataset.round);
                roundElement.querySelectorAll('.match-card').forEach((matchElement) => {
                    const matchIndex = Number(matchElement.dataset.match);
                    const selectedSide = winnerSides[roundIndex][matchIndex];
                    const state = bracketState();
                    const players = [
                        getPlayer(state, roundIndex, matchIndex, 0),
                        getPlayer(state, roundIndex, matchIndex, 1)
                    ];

                    matchElement.querySelectorAll('.bracket-team-row').forEach((row, sideIndex) => {
                        const player = players[sideIndex];
                        const opponent = players[1 - sideIndex];
                        const isBye = !player;
                        const choice = row.querySelector('.winner-choice');
                        const input = row.querySelector('.team-name-input');
                        const byeLabel = row.querySelector('.bye-label');
                        const autoAdvanceLabel = row.querySelector('.auto-advance-label');
                        const isSelected = selectedSide === sideIndex;

                        row.classList.toggle('is-winner', isSelected);
                        if (input) {
                            if (document.activeElement !== input) {
                                input.value = player ? player.name : '';
                            }
                            input.disabled = isBye;
                        }
                        if (byeLabel) {
                            byeLabel.textContent = player
                                ? (player.name || `Team ${player.teamIndex + 1}`)
                                : (roundIndex === 0 ? 'BYE' : 'TBD');
                        }
                        if (autoAdvanceLabel) {
                            autoAdvanceLabel.hidden = !(roundIndex === 0 && player && !opponent);
                        }
                        if (choice) {
                            const autoAdvance = roundIndex === 0 && player && !opponent;
                            choice.hidden = isBye || Boolean(autoAdvance);
                            choice.disabled = isBye || Boolean(autoAdvance) || !player?.name.trim() ||
                                !opponent?.name.trim();
                            choice.textContent = isSelected ? '✓' : '○';
                            choice.setAttribute('aria-label', player
                                ? `${isSelected ? 'Winner' : 'Select'} ${player.name || `Team ${player.teamIndex + 1}`}`
                                : (roundIndex === 0 ? 'Bye' : 'Waiting for previous match'));
                        }
                    });
                });
            });
            updateThirdPlace();
        }

        function renderBracket(categoryIndex) {
            activeCategoryIndex = categoryIndex;
            const category = categories[categoryIndex];
            const size = 2 ** Math.ceil(Math.log2(category.teamCount));
            roundCount = Math.log2(size);
            const storedNames = JSON.parse(
                sessionStorage.getItem(categoryTeamsStorageKey(category.number)) || '[]'
            );
            teamNames = Array.from({ length: category.teamCount }, (_, index) => storedNames[index] || '');
            includeThirdPlace = category.teamCount >= 4 &&
                sessionStorage.getItem(categoryThirdPlaceStorageKey(category.number)) === 'true';
            const savedThirdPlaceWinner = sessionStorage.getItem(
                categoryThirdPlaceWinnerStorageKey(category.number)
            );
            thirdPlaceWinnerSide = savedThirdPlaceWinner === '0' || savedThirdPlaceWinner === '1'
                ? Number(savedThirdPlaceWinner)
                : null;

            slotTeams = createBracketSlots(size, category.teamCount);

            const savedWinners = JSON.parse(
                sessionStorage.getItem(categoryWinnersStorageKey(category.number)) || '[]'
            );
            winnerSides = createWinnerSides(size, slotTeams, savedWinners);

            tabButtons.forEach((tab, tabIndex) => {
                const selected = tabIndex === categoryIndex;
                tab.setAttribute('aria-selected', String(selected));
                tab.tabIndex = selected ? 0 : -1;
            });

            title.textContent = category.name;
            summary.textContent = `${category.teamCount} teams · Single elimination · Bye spots advance automatically`;
            leftBracket.replaceChildren();
            finalMatch.replaceChildren();
            rightBracket.replaceChildren();

            function createRound(roundIndex, firstMatchIndex, matchCount, target) {
                const roundElement = document.createElement('section');
                const roundHeading = document.createElement('h2');
                const matchesElement = document.createElement('div');

                roundElement.className = 'bracket-round';
                roundElement.dataset.round = String(roundIndex);
                roundHeading.className = 'round-heading';
                roundHeading.textContent = getRoundName(roundIndex, roundCount);
                matchesElement.className = 'round-matches';
                matchesElement.style.setProperty('--match-span', String(2 ** roundIndex));
                roundElement.append(roundHeading, matchesElement);

                for (let matchIndex = firstMatchIndex; matchIndex < firstMatchIndex + matchCount; matchIndex += 1) {
                    const matchElement = document.createElement('article');
                    matchElement.className = 'match-card';
                    matchElement.dataset.match = String(matchIndex);

                    for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
                        const row = document.createElement('div');
                        const player = getPlayer(bracketState(), roundIndex, matchIndex, sideIndex);
                        const choice = document.createElement('button');
                        const autoAdvanceLabel = document.createElement('span');

                        row.className = 'bracket-team-row';
                        if (roundIndex === 0 && player) {
                            const input = document.createElement('input');
                            const inputLabel = document.createElement('label');
                            input.className = 'team-name-input';
                            input.type = 'text';
                            input.maxLength = 60;
                            input.placeholder = `Team ${player.teamIndex + 1}`;
                            input.value = player.name;
                            inputLabel.className = 'visually-hidden';
                            inputLabel.htmlFor = `team-name-${category.number}-${player.teamIndex + 1}`;
                            input.id = inputLabel.htmlFor;
                            inputLabel.textContent = `Team ${player.teamIndex + 1} name`;
                            input.addEventListener('input', () => {
                                teamNames[player.teamIndex] = input.value;
                                sessionStorage.setItem(
                                    categoryTeamsStorageKey(category.number),
                                    JSON.stringify(teamNames)
                                );
                                saveWinners();
                                updateBracket();
                            });
                            row.append(inputLabel, input);
                        } else {
                            const byeLabel = document.createElement('span');
                            byeLabel.className = 'bye-label';
                            byeLabel.textContent = roundIndex === 0 ? 'BYE' : 'TBD';
                            row.append(byeLabel);
                        }

                        autoAdvanceLabel.className = 'auto-advance-label';
                        autoAdvanceLabel.textContent = 'Advances';
                        row.append(autoAdvanceLabel);

                        choice.type = 'button';
                        choice.className = 'winner-choice';
                        choice.addEventListener('click', () => {
                            if (choice.disabled) return;
                            winnerSides = selectWinner(winnerSides, roundIndex, matchIndex, sideIndex);
                            if (roundIndex <= roundCount - 2) {
                                thirdPlaceWinnerSide = null;
                                saveThirdPlace();
                            }
                            saveWinners();
                            updateBracket();
                        });
                        row.append(choice);
                        matchElement.append(row);
                    }

                    matchesElement.append(matchElement);
                }

                target.append(roundElement);
            }

            const finalRoundIndex = roundCount - 1;
            for (let roundIndex = 0; roundIndex < finalRoundIndex; roundIndex += 1) {
                const roundMatchCount = size / (2 ** (roundIndex + 1));
                const matchesPerSide = roundMatchCount / 2;
                createRound(roundIndex, 0, matchesPerSide, leftBracket);
                createRound(roundIndex, matchesPerSide, matchesPerSide, rightBracket);
            }

            createRound(finalRoundIndex, 0, 1, finalMatch);
            roundsElement.classList.toggle('bracket-single-final', finalRoundIndex === 0);
            roundsElement.style.setProperty('--side-round-count', String(Math.max(1, finalRoundIndex)));
            roundsElement.style.setProperty('--side-row-count', String(Math.max(1, size / 4)));
            roundsElement.style.minHeight = `${Math.max(560, (size / 4) * 156)}px`;
            saveThirdPlace();
            saveWinners();
            updateBracket();
        }

        thirdPlaceToggle.addEventListener('change', () => {
            includeThirdPlace = thirdPlaceToggle.checked;
            if (!includeThirdPlace) {
                thirdPlaceWinnerSide = null;
            }
            saveThirdPlace();
            updateThirdPlace();
        });

        thirdPlaceChoices.forEach((choice, sideIndex) => {
            choice.addEventListener('click', () => {
                if (choice.disabled) {
                    return;
                }
                thirdPlaceWinnerSide = sideIndex;
                saveThirdPlace();
                updateThirdPlace();
            });
        });

        categories.forEach((category, index) => {
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.id = `tournament-tab-${category.number}`;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', 'bracketRounds');
            tab.textContent = category.name;
            tab.addEventListener('click', () => renderBracket(index));
            tab.addEventListener('keydown', (event) => {
                const nextIndex = getNextTabIndex(index, event.key, categoryCount);
                if (nextIndex === null) {
                    return;
                }
                event.preventDefault();
                renderBracket(nextIndex);
                tabButtons[nextIndex].focus();
            });
            tabs.append(tab);
            tabButtons.push(tab);
        });

        renderBracket(0);
    }
}
