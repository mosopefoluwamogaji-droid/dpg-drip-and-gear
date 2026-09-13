// Lightweight animation helpers — no external library, respects
// prefers-reduced-motion, and costs almost nothing on low-end devices.

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Call after rendering any dynamic content (product grids, category tiles, etc.)
// to fade/slide new elements in as they scroll into view.
function observeReveal(selector = ".reveal", root = document) {
  const els = root.querySelectorAll(selector + ":not(.revealed)");
  if (els.length === 0) return;

  if (prefersReducedMotion()) {
    els.forEach((el) => el.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  els.forEach((el, i) => {
    el.style.transitionDelay = Math.min(i * 40, 300) + "ms";
    observer.observe(el);
  });
}

// Animates a number counting up once it scrolls into view. Pass the element
// and the final integer value.
function animateCounter(el, target, duration = 900) {
  if (!el) return;
  if (prefersReducedMotion()) {
    el.textContent = target;
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Runs a counter only once the element scrolls into view.
function animateCounterOnView(el, target, duration) {
  if (!el) return;
  if (prefersReducedMotion()) {
    el.textContent = target;
    return;
  }
  const observer = new IntersectionObserver(
    (entries, obs) => {
      if (entries[0].isIntersecting) {
        animateCounter(el, target, duration);
        obs.disconnect();
      }
    },
    { threshold: 0.5 }
  );
  observer.observe(el);
}
