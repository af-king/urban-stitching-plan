const navItems = Array.from(document.querySelectorAll(".nav-item"));
const observedSections = navItems
  .map((item) => {
    const target = item.getAttribute("href");
    if (!target) return null;
    const section = document.querySelector(target);
    return section ? { item, section } : null;
  })
  .filter(Boolean);

const setActiveItem = (activeId) => {
  for (const { item, section } of observedSections) {
    item.classList.toggle("is-active", `#${section.id}` === activeId);
  }
};

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) {
      setActiveItem(`#${visible.target.id}`);
    }
  },
  {
    rootMargin: "-25% 0px -55% 0px",
    threshold: [0.2, 0.4, 0.6],
  }
);

for (const { section } of observedSections) {
  observer.observe(section);
}
