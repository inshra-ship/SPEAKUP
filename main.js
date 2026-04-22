/* =============================================
   PUBLIC SPEAKING SIMULATOR — SHARED JS
   ============================================= */

// ── Navbar Mobile Toggle ──
function initNavbar() {
  const toggle = document.querySelector('.navbar-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!toggle || !mobileNav) return;
  toggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    const spans = toggle.querySelectorAll('span');
    if (mobileNav.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
    }
  });
}

// ── Page Scroll Buttons ──
function initScrollButtons() {
  const container = document.querySelector('.page-scroll-btns');
  if (!container) return;
  container.querySelector('.scroll-up')?.addEventListener('click', () =>
    window.scrollBy({ top: -400, behavior: 'smooth' })
  );
  container.querySelector('.scroll-down')?.addEventListener('click', () =>
    window.scrollBy({ top: 400, behavior: 'smooth' })
  );
}

// ── Active nav link ──
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── Search ──
function initSearch() {
  const inputs = document.querySelectorAll('.search-input');
  inputs.forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) window.location.href = `scenarios.html?q=${encodeURIComponent(q)}`;
      }
    });
  });
}

// ── Sparkle effect ──
function initSparkles(container) {
  if (!container) return;
  const colors = ['#7aafc5','#4A7899','#EDE8DC'];
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 4) + 's';
    s.style.animationDuration = (3 + Math.random() * 3) + 's';
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    s.style.width = s.style.height = (1 + Math.random() * 3) + 'px';
    container.appendChild(s);
  }
}

// ── Toast notification ──
function showToast(msg, type = 'default') {
  const toast = document.createElement('div');
  const colors = { default: '#4A7899', success: '#5a9e7a', error: '#b85c5c', warning: '#c9a84c' };
  toast.style.cssText = `
    position:fixed; bottom:80px; right:24px; z-index:9999;
    background:var(--bg-card); border:1px solid ${colors[type]};
    border-left: 3px solid ${colors[type]};
    color:var(--text-primary); padding:12px 20px; border-radius:8px;
    font-family:Helvetica,Arial,sans-serif; font-size:13px;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
    animation: fadeUp 0.3s ease; max-width: 280px;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Auth helper (localStorage mock) ──
const Auth = {
  isLoggedIn: () => localStorage.getItem('sps_user') !== null,
  getUser: () => JSON.parse(localStorage.getItem('sps_user') || 'null'),
  login: (data) => localStorage.setItem('sps_user', JSON.stringify(data)),
  logout: () => { localStorage.removeItem('sps_user'); window.location.href = 'index.html'; },
  requireAuth: () => {
    if (!Auth.isLoggedIn()) window.location.href = 'login.html';
  }
};

// ── Update nav for auth state ──
function updateNavAuth() {
  const user = Auth.getUser();
  const authActions = document.querySelector('.nav-auth-actions');
  if (!authActions) return;
  if (user) {
    authActions.innerHTML = `
      <a href="dashboard.html" class="btn btn-ghost btn-sm">Dashboard</a>
      <a href="account.html" class="btn btn-default btn-sm">
        <span style="width:24px;height:24px;border-radius:50%;background:var(--steel-blue);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${(user.name||'U')[0].toUpperCase()}</span>
        ${user.name || 'Account'}
      </a>
    `;
  } else {
    authActions.innerHTML = `
      <a href="login.html" class="btn btn-ghost btn-sm">Sign In</a>
      <a href="signup.html" class="btn btn-solid btn-sm">Get Started</a>
    `;
  }
}

// ── Init all ──
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollButtons();
  setActiveNav();
  initSearch();
  updateNavAuth();

  // Sparkles on hero sections
  const sparkleContainer = document.querySelector('.sparkle-container');
  if (sparkleContainer) initSparkles(sparkleContainer);

  // Fade-in on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});