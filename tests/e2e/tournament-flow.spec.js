import { expect, test } from '@playwright/test';

test('changes and remembers the selected color theme across screens', async ({ page }) => {
    await page.goto('/index.html');

    const themeSelector = page.locator('#themeSelector');
    await expect(themeSelector.locator('option')).toHaveCount(5);
    await themeSelector.selectOption('red-black');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'red-black');
    await expect(page.locator('html')).toHaveCSS('--page', '#171717');

    await page.locator('#categories').fill('1');
    await page.locator('#startButton').click();
    await expect(page).toHaveURL(/bracket\.html$/);
    await expect(page.locator('#themeSelector')).toHaveValue('red-black');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'red-black');

    await page.locator('#category-team-count-1').fill('4');
    await page.locator('#generateBracketButton').click();
    await expect(page).toHaveURL(/tournament\.html$/);
    await expect(page.locator('#themeSelector')).toHaveValue('red-black');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'red-black');
    await expect(page.locator('.round-heading')).toHaveCount(0);
    await expect(page.locator('#finalRound')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 48)');
    await page.locator('#thirdPlaceToggle').check();
    await expect(page.locator('#thirdPlaceRound')).toBeVisible();
    await expect(page.locator('#thirdPlaceRound .round-heading')).toHaveCount(0);
    const thirdPlaceBounds = await page.locator('#thirdPlaceRound').boundingBox();
    const toggleBounds = await page.locator('.third-place-toggle').boundingBox();
    expect(thirdPlaceBounds).not.toBeNull();
    expect(toggleBounds).not.toBeNull();
    expect(toggleBounds.y).toBeGreaterThan(thirdPlaceBounds.y + thirdPlaceBounds.height);
    const finalMatchBounds = await page.locator('#finalMatch .match-card').boundingBox();
    const thirdPlaceMatchBounds = await page.locator('#thirdPlaceRound .match-card').boundingBox();
    expect(finalMatchBounds).not.toBeNull();
    expect(thirdPlaceMatchBounds).not.toBeNull();
    expect(thirdPlaceMatchBounds.y).toBeGreaterThan(finalMatchBounds.y);
    await expect(page.locator('.third-place-toggle')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('.third-place-toggle')).toHaveCSS('opacity', '0.78');

    await page.locator('#themeSelector').selectOption('blue-mint');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'blue-mint');
    await expect(page.locator('html')).toHaveCSS('--page', '#effaf7');
    await expect(page.locator('.round-heading')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#themeSelector')).toHaveValue('blue-mint');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'blue-mint');
});

test('omits all round headings for a bracket with top-16 and quarter-final rounds', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('#categories').fill('1');
    await page.locator('#startButton').click();
    await page.locator('#category-team-count-1').fill('32');
    await page.locator('#generateBracketButton').click();

    await expect(page).toHaveURL(/tournament\.html$/);
    await expect(page.locator('.bracket-round')).toHaveCount(9);
    await expect(page.locator('.round-heading')).toHaveCount(0);

    await page.locator('#thirdPlaceToggle').check();
    await expect(page.locator('#thirdPlaceRound')).toBeVisible();
    await expect(page.locator('.round-heading')).toHaveCount(0);
});

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
