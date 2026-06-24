export function scrollToElement(target, { duration = 320, offset = 0 } = {}) {
  if (!target || typeof window === 'undefined') return;

  const startY = window.scrollY;
  const targetY = Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - offset
  );
  const distance = targetY - startY;

  if (Math.abs(distance) < 2) return;

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    window.scrollTo(0, targetY);
    return;
  }

  const startTime = window.performance.now();
  const easeOutCubic = (t) => 1 - (1 - t) ** 3;

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const nextY = startY + distance * easeOutCubic(progress);

    window.scrollTo(0, nextY);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

