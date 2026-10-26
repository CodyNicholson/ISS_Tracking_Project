// Buttons with data-href navigate there (no inline onclick: the Content-Security-Policy blocks those)
document.querySelectorAll('[data-href]').forEach(function (button) {
    button.addEventListener('click', function () {
        location.href = button.dataset.href;
    });
});
