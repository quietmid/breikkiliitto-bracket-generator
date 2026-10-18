function getSeedPositions(size) {
    let seedPositions = [1];

    while (seedPositions.length < size) {
        const nextSize = seedPositions.length * 2;
        seedPositions = seedPositions.flatMap((seed) => [seed, nextSize + 1 - seed]);
    }

    let matchOrder = [0];
    while (matchOrder.length < size / 2) {
        const matchCount = matchOrder.length;
        matchOrder = [
            ...matchOrder,
            ...Array.from({ length: matchCount }, (_, index) => matchCount * 2 - 1 - index)
        ];
    }

    return matchOrder.flatMap((matchIndex) => seedPositions.slice(matchIndex * 2, matchIndex * 2 + 2));
}

export function createBracketSlots(size, teamCount, mode = 'manual') {
    if (mode === 'ranked') {
        return getSeedPositions(size).map((seed) => (
            seed <= teamCount ? seed - 1 : null
        ));
    }

    const slots = Array(size).fill(null);
    const matchCount = size / 2;
    const byeCount = size - teamCount;
    const byeMatchOrder = [];

    for (let low = 0, high = matchCount - 1; low <= high; low += 1, high -= 1) {
        byeMatchOrder.push(low);
        if (low !== high) {
            byeMatchOrder.push(high);
        }
    }

    let teamIndex = 0;
    const byeMatches = new Set(byeMatchOrder.slice(0, byeCount));
    for (let matchIndex = 0; matchIndex < matchCount; matchIndex += 1) {
        const firstSlot = matchIndex * 2;
        slots[firstSlot] = teamIndex;
        teamIndex += 1;
        if (!byeMatches.has(matchIndex)) {
            slots[firstSlot + 1] = teamIndex;
            teamIndex += 1;
        }
    }

    return slots;
}

export function shuffleTeams(teams, random = Math.random) {
    const shuffledTeams = [...teams];

    for (let index = shuffledTeams.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffledTeams[index], shuffledTeams[swapIndex]] = [
            shuffledTeams[swapIndex],
            shuffledTeams[index]
        ];
    }

    return shuffledTeams;
}

export function getPlayer(state, roundIndex, matchIndex, sideIndex) {
    const { slotTeams, teamNames, winnerSides } = state;

    if (roundIndex === 0) {
        const teamIndex = slotTeams[matchIndex * 2 + sideIndex];
        return teamIndex === null ? null : { teamIndex, name: teamNames[teamIndex] || '' };
    }

    const previousMatchIndex = matchIndex * 2 + sideIndex;
    const selectedSide = winnerSides[roundIndex - 1][previousMatchIndex];
    return selectedSide === null
        ? null
        : getPlayer(state, roundIndex - 1, previousMatchIndex, selectedSide);
}

export function getLoser(state, roundIndex, matchIndex) {
    const selectedSide = state.winnerSides[roundIndex][matchIndex];
    return selectedSide === null
        ? null
        : getPlayer(state, roundIndex, matchIndex, 1 - selectedSide);
}

export function createWinnerSides(size, slotTeams, savedWinners) {
    const roundCount = Math.log2(size);
    return Array.from({ length: roundCount }, (_, roundIndex) => {
        const matchesInRound = size / (2 ** (roundIndex + 1));
        return Array.from({ length: matchesInRound }, (_, matchIndex) => {
            const savedSide = savedWinners[roundIndex]?.[matchIndex];
            if (roundIndex === 0) {
                const firstTeam = slotTeams[matchIndex * 2];
                const secondTeam = slotTeams[matchIndex * 2 + 1];
                if (firstTeam === null && secondTeam !== null) {
                    return 1;
                }
                if (secondTeam === null && firstTeam !== null) {
                    return 0;
                }
            }
            return savedSide === 0 || savedSide === 1 ? savedSide : null;
        });
    });
}

export function selectWinner(winnerSides, roundIndex, matchIndex, sideIndex) {
    const updatedWinnerSides = winnerSides.map((round) => [...round]);
    updatedWinnerSides[roundIndex][matchIndex] = sideIndex;

    let affectedMatchIndex = matchIndex;
    for (let laterRound = roundIndex + 1; laterRound < updatedWinnerSides.length; laterRound += 1) {
        affectedMatchIndex = Math.floor(affectedMatchIndex / 2);
        updatedWinnerSides[laterRound][affectedMatchIndex] = null;
    }

    return updatedWinnerSides;
}
