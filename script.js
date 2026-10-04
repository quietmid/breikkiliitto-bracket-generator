const input = document.getElementById('categories');
const button = document.getElementById('startButton');

input.addEventListener('input', () => {
    const value = Number(input.value);
    const isValid = input.value !== "" && Number.isInteger(value) && value > 0;
    button.disabled = !isValid;
});

button.addEventListener('click', () => {
    const categoryCount = input.value;
    // Save it for the next page (using sessionStorage, which works fine in plain JS)
    sessionStorage.setItem('categoryCount', categoryCount);
    // Navigate to the bracket page
    window.location.href = 'bracket.html';
});