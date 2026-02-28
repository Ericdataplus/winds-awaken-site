/* ═══════════════════════════════════════════════════════════
   WINDS AWAKEN — Game Landing Page Scripts
   Wind particles, scroll animations, lightbox, navigation
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initWindParticles();
    initNavigation();
    initScrollAnimations();
    initLightbox();
    initNewsletterForm();
    initSmoothScroll();
});

/* ─── Wind Particle System ────────────────────────────── */
function initWindParticles() {
    const canvas = document.getElementById('wind-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrame;
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class WindParticle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedX = Math.random() * 1.5 + 0.3;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.6 + 0.1;
            this.hue = Math.random() > 0.7 ? 48 : 170; // gold or teal
            this.life = Math.random() * 200 + 100;
            this.maxLife = this.life;
            this.wobbleSpeed = Math.random() * 0.02 + 0.005;
            this.wobbleAmp = Math.random() * 30 + 10;
            this.angle = Math.random() * Math.PI * 2;
        }

        update() {
            this.x += this.speedX;
            this.angle += this.wobbleSpeed;
            this.y += this.speedY + Math.sin(this.angle) * 0.3;
            this.life--;

            if (this.x > width + 10 || this.life <= 0) {
                this.reset();
                this.x = -10;
            }
        }

        draw() {
            const fadeRatio = Math.min(this.life / this.maxLife, (this.maxLife - this.life) / 20);
            const alpha = this.opacity * Math.min(fadeRatio, 1);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, 1)`;
            ctx.shadowBlur = this.size * 4;
            ctx.shadowColor = `hsla(${this.hue}, 80%, 70%, 0.5)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function init() {
        resize();
        particles = [];
        const count = Math.min(Math.floor(width * height / 15000), 80);
        for (let i = 0; i < count; i++) {
            particles.push(new WindParticle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        animFrame = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resize();
    });

    init();
    animate();
}

/* ─── Navigation ──────────────────────────────────────── */
function initNavigation() {
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('nav-toggle');
    const links = document.querySelector('.nav-links');

    // Scroll behavior — add background on scroll
    let lastScrollY = 0;
    let ticking = false;

    function onScroll() {
        lastScrollY = window.scrollY;
        if (!ticking) {
            requestAnimationFrame(() => {
                if (lastScrollY > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Mobile toggle
    if (toggle) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('open');
            toggle.classList.toggle('active');
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            links.classList.remove('open');
            toggle.classList.remove('active');
        });
    });

    // Active link highlighting based on scroll position
    const sections = document.querySelectorAll('section[id]');
    
    function highlightActiveLink() {
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            
            if (link && scrollPos >= top && scrollPos < top + height) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightActiveLink, { passive: true });
}

/* ─── Scroll Reveal Animations ────────────────────────── */
function initScrollAnimations() {
    // Add reveal classes to elements
    const revealSelectors = [
        '.section-header',
        '.feature-card',
        '.world-card',
        '.gallery-item',
        '.buy-container',
        '.newsletter-container'
    ];

    revealSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, i) => {
            el.classList.add('reveal');
            el.style.transitionDelay = `${i * 0.08}s`;
        });
    });

    // About section special animations
    const aboutText = document.querySelector('.about-text');
    const aboutVisual = document.querySelector('.about-visual');
    if (aboutText) aboutText.classList.add('reveal-left');
    if (aboutVisual) aboutVisual.classList.add('reveal-right');

    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
        observer.observe(el);
    });
}

/* ─── Lightbox ────────────────────────────────────────── */
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    if (!lightbox) return;

    const galleryItems = document.querySelectorAll('.gallery-item');
    let currentIndex = 0;
    const images = [];

    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        const caption = item.querySelector('.gallery-caption');
        
        images.push({
            src: img.src,
            alt: img.alt,
            caption: caption ? caption.textContent : ''
        });

        item.addEventListener('click', () => {
            currentIndex = index;
            openLightbox();
        });
    });

    function openLightbox() {
        const data = images[currentIndex];
        lightboxImg.src = data.src;
        lightboxImg.alt = data.alt;
        lightboxCaption.textContent = data.caption;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightbox();
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % images.length;
        updateLightbox();
    }

    function updateLightbox() {
        const data = images[currentIndex];
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = data.src;
            lightboxImg.alt = data.alt;
            lightboxCaption.textContent = data.caption;
            lightboxImg.style.opacity = '1';
        }, 200);
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrev);
    lightboxNext.addEventListener('click', showNext);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    });
}

/* ─── Newsletter Form ─────────────────────────────────── */
function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletter-email');
        const btn = document.getElementById('newsletter-submit');
        
        if (!email.value) return;

        // Visual feedback (static site — no backend)
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
        email.value = '';
        
        // Store in localStorage as a simple persistence demo
        const subscribers = JSON.parse(localStorage.getItem('wa_subscribers') || '[]');
        subscribers.push({ email: email.value, date: new Date().toISOString() });
        localStorage.setItem('wa_subscribers', JSON.stringify(subscribers));

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 3000);
    });
}

/* ─── Smooth Scroll ───────────────────────────────────── */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            const navHeight = document.getElementById('main-nav').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/* ─── Parallax on scroll (subtle) ─────────────────────── */
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroImg = document.querySelector('.hero-img');
    
    if (heroImg && scrollY < window.innerHeight) {
        heroImg.style.transform = `scale(${1.05 + scrollY * 0.0001}) translateY(${scrollY * 0.15}px)`;
    }
}, { passive: true });
