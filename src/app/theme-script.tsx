export function ThemeScript() {
  return (
    <script
      id="theme-script"
      dangerouslySetInnerHTML={{
        __html: `
          let isDark;
          try {
            isDark = localStorage.getItem('theme') === 'dark' ||
              (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
          } catch (e) {
            console.error(e)
          }
          if (isDark) {
            document.documentElement.classList.add('dark')
          }
          if (typeof localStorage !== 'undefined') {
            const observer = new MutationObserver(() => {
              const isDark = document.documentElement.classList.contains('dark')
              localStorage.setItem('theme', isDark ? 'dark' : 'light')
            })
            observer.observe(document.documentElement, {
              attributes: true,
              attributeFilter: ['class'],
            })
          }
        `,
      }}
    />
  );
} 