// ==========================================================================
// YASHVI GROUP MASTER HOLDINGS PORTAL - JAVASCRIPT LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initHeroMotionCanvas();
  initCounters();
  initMobileMenu();
  initNavbarScroll();
});

// 1. Google / Antigravity Interactive Particle Constellation Canvas
function initHeroMotionCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let animationFrameId;

  // Track mouse coordinates
  const mouse = {
    x: null,
    y: null,
    radius: 170
  };

  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    heroSection.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
  }

  // Handle Resize
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.parentElement.offsetWidth;
    height = canvas.parentElement.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
  resize();

  // Particle Class
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2.2 + 1.2;
      this.baseX = this.x;
      this.baseY = this.y;
      this.vx = (Math.random() - 0.5) * 0.55;
      this.vy = (Math.random() - 0.5) * 0.55;
      this.color = Math.random() > 0.4 ? 'rgba(6, 182, 212, ' : 'rgba(37, 99, 235, ';
      this.alpha = Math.random() * 0.6 + 0.3;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.alpha + ')';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    update() {
      // Natural drifting
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off boundaries
      if (this.x < 0 || this.x > width) this.vx = -this.vx;
      if (this.y < 0 || this.y > height) this.vy = -this.vy;

      // Mouse interactivity (Antigravity repulsion & connection)
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 3;
          this.y -= Math.sin(angle) * force * 3;
        }
      }
    }
  }

  let particles = [];
  function createParticles() {
    particles = [];
    const count = Math.floor((width * height) / 14000);
    const safeCount = Math.min(Math.max(count, 45), 95);
    for (let i = 0; i < safeCount; i++) {
      particles.push(new Particle());
    }
  }
  createParticles();

  // Connect particles with delicate geometric lines
  function connect() {
    const maxDist = 125;
    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.22;
          ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }

      // Connect to mouse if close
      if (mouse.x !== null && mouse.y !== null) {
        const dxMouse = particles[a].x - mouse.x;
        const dyMouse = particles[a].y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < mouse.radius) {
          const opacity = (1 - distMouse / mouse.radius) * 0.35;
          ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
  }

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    connect();

    animationFrameId = requestAnimationFrame(animate);
  }
  animate();
}

// 2. Animated Stats Counters with Intersection Observer
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        counters.forEach(counter => {
          const target = +counter.getAttribute('data-target');
          let count = 0;
          const speed = target > 1000 ? target / 50 : 1;

          const updateCount = () => {
            count += speed;
            if (count < target) {
              counter.innerText = Math.ceil(count).toLocaleString();
              requestAnimationFrame(updateCount);
            } else {
              counter.innerText = target.toLocaleString();
            }
          };

          updateCount();
        });
      }
    });
  }, { threshold: 0.3 });

  const metricsSection = document.querySelector('.metrics-section');
  if (metricsSection) {
    observer.observe(metricsSection);
  }
}

// 3. Mobile Navigation Menu Toggle
function initMobileMenu() {
  const toggleBtn = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = toggleBtn.querySelector('i');
      if (navMenu.classList.contains('open')) {
        icon.className = 'ph ph-x';
      } else {
        icon.className = 'ph ph-list';
      }
    });

    // Close when clicking any link inside the mobile drawer
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'ph ph-list';
      });
    });
  }
}

// 4. Navbar Scroll Glass Effect
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.style.borderBottomColor = 'rgba(6, 182, 212, 0.25)';
      navbar.style.background = 'rgba(11, 15, 25, 0.96)';
    } else {
      navbar.style.borderBottomColor = 'rgba(255, 255, 255, 0.08)';
      navbar.style.background = 'rgba(11, 15, 25, 0.92)';
    }
  });
}

// 5. Division Button Selector in Universal Lead Form
window.setCategory = function(buttonElement, categoryName) {
  const buttons = document.querySelectorAll('.div-btn');
  buttons.forEach(b => b.classList.remove('active'));
  buttonElement.classList.add('active');

  const hiddenInput = document.getElementById('inquiryTypeInput');
  if (hiddenInput) {
    hiddenInput.value = categoryName;
  }
};

// Helper to trigger category selection from external buttons
window.selectInquiryType = function(typeKey) {
  const mapping = {
    'sponsorship': 'Event Sponsorship & Stalls',
    'digital': 'Digital Marketing & Studio',
    'news': 'News Tip & Media Coverage',
    'hospitality': 'Hospitality & Corporate Stays',
    'general': 'General / CSR Inquiries'
  };

  const categoryName = mapping[typeKey] || 'General / CSR Inquiries';
  const matchingBtn = document.querySelector(`.div-btn[data-category="${typeKey}"]`);
  
  if (matchingBtn) {
    window.setCategory(matchingBtn, categoryName);
  }

  // Smooth scroll to contact section
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const nameInput = document.getElementById('fullName');
      if (nameInput) nameInput.focus();
    }, 600);
  }
};

// 6. Handle Form Submit with In-page Feedback
window.handleFormSubmit = function(event) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const successBanner = document.getElementById('successBanner');
  const form = document.getElementById('leadForm');

  if (submitBtn) {
    submitBtn.innerHTML = '<span>Transmitting...</span> <i class="ph ph-spinner ph-spin"></i>';
    submitBtn.disabled = true;
  }

  // Simulate transmission
  setTimeout(() => {
    if (submitBtn) {
      submitBtn.innerHTML = '<span>Submitted Successfully</span> <i class="ph-fill ph-check"></i>';
      submitBtn.style.background = '#10B981';
      submitBtn.style.borderColor = '#10B981';
    }

    if (successBanner) {
      successBanner.style.display = 'flex';
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    form.reset();
  }, 800);
};
