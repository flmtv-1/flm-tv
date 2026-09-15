// ==========================
// 🎬 Hero Slideshow Script
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");
  let currentIndex = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
      if (dots[i]) dots[i].classList.toggle("active", i === index);
    });
    currentIndex = index;
  }

  function nextSlide() {
    let nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
  }

  // autoplay every 5s
  function startSlideshow() {
    slideInterval = setInterval(nextSlide, 5000);
  }

  // manual dot click
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      clearInterval(slideInterval);
      showSlide(i);
      startSlideshow();
    });
  });

  // start
  showSlide(0);
  startSlideshow();
});
