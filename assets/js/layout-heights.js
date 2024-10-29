function layoutHeights() {
    const header = document.querySelector('header');
    const headerHeight = header.scrollHeight;

    document.documentElement.style.setProperty('--header-height', `calc(${headerHeight}px + var(--margin))`);
}

layoutHeights();
window.addEventListener('resize', layoutHeights);