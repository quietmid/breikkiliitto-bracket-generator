import { expect, test } from '@playwright/test';

test('creates and completes a one-category, eight-team tournament without a photo', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#backgroundPhotoStatus')).toBeEmpty();

    await page.locator('#categories').fill('1');
    await page.locator('#startButton').click();
    await expect(page).toHaveURL(/bracket\.html$/);
    await expect(page.getByRole('tab')).toHaveCount(1);

    await page.locator('#category-team-count-1').fill('8');
    await page.locator('#generateBracketButton').click();
    await expect(page).toHaveURL(/tournament\.html$/);
    await expect(page.locator('#tournamentSummary')).toContainText('8 teams');

    const teamInputs = page.locator('.team-name-input');
    await expect(teamInputs).toHaveCount(8);
    for (let index = 0; index < 8; index += 1) {
        await teamInputs.nth(index).fill(`Team ${index + 1}`);
    }

    for (let matchIndex = 0; matchIndex < 4; matchIndex += 1) {
        await page
            .locator(`.bracket-round[data-round="0"] .match-card[data-match="${matchIndex}"] .winner-choice`)
            .first()
            .click();
    }

    for (let matchIndex = 0; matchIndex < 2; matchIndex += 1) {
        await page
            .locator(`.bracket-round[data-round="1"] .match-card[data-match="${matchIndex}"] .winner-choice`)
            .first()
            .click();
    }

    await page
        .locator('.bracket-round[data-round="2"] .match-card[data-match="0"] .winner-choice')
        .first()
        .click();

    const championRow = page.locator(
        '.bracket-round[data-round="2"] .match-card[data-match="0"] .bracket-team-row.is-winner'
    );
    await expect(championRow).toContainText('Team 1');
    await expect(championRow.locator('.bye-label')).toHaveCSS('color', 'rgb(94, 63, 192)');
    await expect(page.locator('body')).not.toHaveClass(/has-background-photo/);

    await page.reload();
    await expect(page.locator('#tournamentTitle')).toHaveText('Category 1');
    await expect(page.locator('.team-name-input')).toHaveCount(8);
    await expect(
        page.locator('.bracket-round[data-round="2"] .match-card[data-match="0"] .bracket-team-row.is-winner')
    ).toContainText('Team 1');
    await expect(
        page.locator('.bracket-round[data-round="2"] .match-card[data-match="0"] .bracket-team-row.is-winner .bye-label')
    ).toHaveCSS('color', 'rgb(94, 63, 192)');
});
