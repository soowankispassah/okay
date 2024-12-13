// This script runs before page load to prevent dark mode flash
export function setInitialDarkMode() {
  return `
    try {
      const darkModeData = localStorage.getItem('dark-mode-storage');
      if (darkModeData) {
        const darkMode = JSON.parse(darkModeData).state.isDarkMode;
        if (darkMode) {
          document.documentElement.classList.add('dark');
        }
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      console.error('Error setting initial dark mode:', e);
    }
  `;
}
