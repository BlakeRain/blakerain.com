window.addEventListener("DOMContentLoaded", () => {
  const navMenu = document.getElementById("nav-menu");
  const toggle = document.getElementById("nav-menu-toggle");
  if (toggle && navMenu) {
    toggle.addEventListener("click", () => {
      navMenu.classList.toggle("open");
    });
  }
});
