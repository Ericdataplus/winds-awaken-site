/* ═══════════════════════════════════════════════════════════
   WINDS AWAKEN — Game Landing Page Scripts
   Awwwards-level creative effects: cursor glow, tilt cards,
   bioluminescent particles, mouse parallax, scroll reveals
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initWindParticles();
    initNavigation();
    initScrollAnimations();
    initLightbox();
    initNewsletterForm();
    initSmoothScroll();
    initCursorGlow();
    initTiltCards();
    initMouseParallax();
    initTextReveal();
});

/* ─── Custom Cursor Glow Trail ────────────────────────── */
function initCursorGlow() {
    // Skip on touch devices
    if ('ontouchstart' in window) return;

    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    document.body.appendChild(glow);

    const trail = document.createElement('div');
    trail.id = 'cursor-trail';
    document.body.appendChild(trail);

    let mouseX = -100, mouseY = -100;
    let glowX = -100, glowY = -100;
    let trailX = -100, trailY = -100;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        // Smooth easing follow
        glowX += (mouseX - glowX) * 0.15;
        glowY += (mouseY - glowY) * 0.15;
        trailX += (mouseX - trailX) * 0.08;
        trailY += (mouseY - trailY) * 0.08;

        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        trail.style.left = trailX + 'px';
        trail.style.top = trailY + 'px';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Scale up over interactive elements
    const interactives = document.querySelectorAll('a, button, .gallery-item, .feature-card, .world-card');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            glow.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
            glow.classList.remove('cursor-hover');
        });
    });
}

/* ─── 3D Tilt Cards ───────────────────────────────────── */
function initTiltCards() {
    const cards = document.querySelectorAll('.feature-card, .world-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.02)`;

            // Move the highlight glow
            const glowEl = card.querySelector('.card-glow');
            if (glowEl) {
                glowEl.style.left = x + 'px';
                glowEl.style.top = y + 'px';
                glowEl.style.opacity = '0.4';
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            const glowEl = card.querySelector('.card-glow');
            if (glowEl) glowEl.style.opacity = '0';
            setTimeout(() => { card.style.transition = ''; }, 500);
        });

        // Add glow element if it doesn't exist
        if (!card.querySelector('.card-glow')) {
            const glowDiv = document.createElement('div');
            glowDiv.className = 'card-glow';
            card.appendChild(glowDiv);
        }
    });
}

/* ─── Mouse-Reactive Hero Parallax ────────────────────── */
function initMouseParallax() {
    const hero = document.getElementById('hero');
    const heroImg = document.querySelector('.hero-img');
    const heroLogo = document.getElementById('hero-logo');
    if (!hero || !heroImg) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        targetX = x;
        targetY = y;
    });

    function animateParallax() {
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;

        if (heroImg) {
            const scrollY = window.scrollY;
            const baseScale = 1.05 + scrollY * 0.0001;
            heroImg.style.transform = `scale(${baseScale}) translate(${currentX * -20}px, ${currentY * -15 + scrollY * 0.15}px)`;
        }
        if (heroLogo) {
            heroLogo.style.transform = `translate(${currentX * 10}px, ${currentY * 8}px)`;
        }

        requestAnimationFrame(animateParallax);
    }
    animateParallax();
}

/* ─── Scroll-Driven Text Reveal ───────────────────────── */
function initTextReveal() {
    // Split section header h2 text into individual characters for reveal
    document.querySelectorAll('.section-header h2').forEach(h2 => {
        const text = h2.textContent;
        h2.innerHTML = '';
        h2.setAttribute('aria-label', text);

        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.className = 'char-reveal';
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.animationDelay = `${i * 0.03}s`;
            span.style.setProperty('--char-index', i);
            h2.appendChild(span);
        });
    });

    // Observe h2 elements to trigger the animation
    const charObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('chars-visible');
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.section-header h2').forEach(h2 => {
        charObserver.observe(h2);
    });
}

/* ─── Bioluminescent Wind Particle System ─────────────── */
function initWindParticles() {
    const canvas = document.getElementById('wind-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let width, height;
    let mouseX = -1000, mouseY = -1000;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class BioParticle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseSize = Math.random() * 3 + 0.5;
            this.size = this.baseSize;
            this.speedX = Math.random() * 1.2 + 0.2;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.1;
            // Bioluminescent colors: teal, aqua, gold, pink, green
            const colors = [
                { h: 170, s: 80, l: 65 }, // teal
                { h: 190, s: 90, l: 70 }, // aqua
                { h: 48, s: 85, l: 65 },  // gold
                { h: 320, s: 70, l: 70 }, // pink
                { h: 140, s: 75, l: 60 }, // green
            ];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.life = Math.random() * 300 + 150;
            this.maxLife = this.life;
            this.wobbleSpeed = Math.random() * 0.015 + 0.003;
            this.wobbleAmp = Math.random() * 25 + 8;
            this.angle = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.03 + 0.01;
            this.pulsePhase = Math.random() * Math.PI * 2;
        }

        update() {
            this.x += this.speedX;
            this.angle += this.wobbleSpeed;
            this.y += this.speedY + Math.sin(this.angle) * 0.25;
            this.life--;

            // Pulsing glow
            this.size = this.baseSize + Math.sin(this.pulsePhase + performance.now() * this.pulseSpeed * 0.001) * this.baseSize * 0.4;

            // React to mouse — glow brighter & drift away gently
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const force = (150 - dist) / 150;
                this.x += (dx / dist) * force * 0.8;
                this.y += (dy / dist) * force * 0.5;
                this.size = this.baseSize + force * 3;
            }

            if (this.x > width + 10 || this.life <= 0) {
                this.reset();
                this.x = -10;
            }
        }

        draw() {
            const fadeRatio = Math.min(this.life / this.maxLife, (this.maxLife - this.life) / 25);
            const alpha = this.opacity * Math.min(fadeRatio, 1);
            const { h, s, l } = this.color;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Outer glow
            ctx.shadowBlur = this.size * 8;
            ctx.shadowColor = `hsla(${h}, ${s}%, ${l}%, 0.6)`;
            ctx.fillStyle = `hsla(${h}, ${s}%, ${l + 15}%, 1)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright core
            ctx.shadowBlur = 0;
            ctx.fillStyle = `hsla(${h}, ${s - 10}%, ${Math.min(l + 30, 95)}%, 0.9)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    function init() {
        resize();
        particles = [];
        const count = Math.min(Math.floor(width * height / 12000), 100);
        for (let i = 0; i < count; i++) {
            particles.push(new BioParticle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    init();
    animate();
}

/* ─── Navigation ──────────────────────────────────────── */
function initNavigation() {
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('nav-toggle');
    const links = document.querySelector('.nav-links');

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

    if (toggle) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('open');
            toggle.classList.toggle('active');
        });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            links.classList.remove('open');
            if (toggle) toggle.classList.remove('active');
        });
    });

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

    const aboutText = document.querySelector('.about-text');
    const aboutVisual = document.querySelector('.about-visual');
    if (aboutText) aboutText.classList.add('reveal-left');
    if (aboutVisual) aboutVisual.classList.add('reveal-right');

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

        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';

        const subscribers = JSON.parse(localStorage.getItem('wa_subscribers') || '[]');
        subscribers.push({ email: email.value, date: new Date().toISOString() });
        localStorage.setItem('wa_subscribers', JSON.stringify(subscribers));
        email.value = '';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 3000);
    });
}

/* ─── Smooth Scroll ───────────────────────────────────── */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
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
