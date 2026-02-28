/* ═══════════════════════════════════════════════════════════
   WINDS AWAKEN — Landing Page Scripts
   Lightweight Three.js particles + GSAP scroll animations
   ═══════════════════════════════════════════════════════════ */

import * as THREE from 'three';

/* ─── Globals ────────────────────────────────────────────── */
let mouse = { x: 0, y: 0 };

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initLenis();
    initGSAP();
    initCursorGlow();
    initTiltCards();
    initNavigation();
    initLightbox();
    initNewsletterForm();
    initSmoothScroll();
});

/* ═══════════════════════════════════════════════════════════
   LIGHTWEIGHT THREE.JS PARTICLES (hero only)
   Just glowing dots — no ocean, no bloom, no shaders
   ═══════════════════════════════════════════════════════════ */
function initParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap for perf

    // Simple particle system — 150 dots
    const count = 150;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const palette = [
        [0.1, 1.0, 0.8],  // teal
        [0.0, 0.86, 1.0], // aqua
        [0.94, 0.78, 0.31],// gold
        [1.0, 0.41, 0.71], // pink
        [0.31, 1.0, 0.5],  // green
    ];

    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 60;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        const c = palette[Math.floor(Math.random() * palette.length)];
        col[i * 3] = c[0];
        col[i * 3 + 1] = c[1];
        col[i * 3 + 2] = c[2];
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animate — very simple, very fast
    function animate() {
        requestAnimationFrame(animate);

        // Gentle rotation
        points.rotation.y += 0.0003;
        points.rotation.x += 0.0001;

        // Subtle mouse influence
        points.rotation.y += (mouse.x * 0.0005 - points.rotation.y * 0.001);
        points.rotation.x += (mouse.y * 0.0003 - points.rotation.x * 0.001);

        // Fade on scroll
        const heroH = window.innerHeight;
        const fade = Math.max(0, 1 - window.scrollY / heroH);
        canvas.style.opacity = fade;

        // Only render if hero is visible
        if (fade > 0) {
            renderer.render(scene, camera);
        }
    }
    animate();
}

/* ═══════════════════════════════════════════════════════════
   LENIS SMOOTH SCROLL
   ═══════════════════════════════════════════════════════════ */
function initLenis() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: false,
    });

    lenis.on('scroll', () => {
        const hint = document.getElementById('scroll-hint');
        if (hint) hint.style.opacity = Math.max(0, 1 - window.scrollY / 200);
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // GSAP integration
    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }
}

/* ═══════════════════════════════════════════════════════════
   GSAP SCROLL ANIMATIONS
   ═══════════════════════════════════════════════════════════ */
function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Animate [data-animate] elements
    document.querySelectorAll('[data-animate]').forEach(el => {
        const type = el.getAttribute('data-animate');
        const delay = parseFloat(el.getAttribute('data-delay') || 0) * 0.1;
        const from = { opacity: 0 };
        if (type === 'fade-up') from.y = 40;
        if (type === 'slide-left') from.x = -50;
        if (type === 'slide-right') from.x = 50;

        gsap.from(el, {
            ...from,
            duration: 0.8,
            delay,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
        });
    });

    // Parallax on world card images
    document.querySelectorAll('.world-img-wrapper img').forEach(img => {
        gsap.to(img, {
            yPercent: -10,
            ease: 'none',
            scrollTrigger: {
                trigger: img.closest('.world-card'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
        });
    });

    // Logo fades out on scroll
    const heroLogo = document.getElementById('hero-logo');
    if (heroLogo) {
        gsap.to(heroLogo, {
            y: -60,
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: '60% top',
                scrub: true,
            },
        });
    }

    // Stat count-up
    document.querySelectorAll('.stat-number').forEach(stat => {
        const num = parseInt(stat.textContent);
        if (isNaN(num)) return;
        const obj = { v: 0 };
        gsap.to(obj, {
            v: num,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: { trigger: stat, start: 'top 85%' },
            onUpdate: () => { stat.textContent = Math.round(obj.v); },
        });
    });
}

/* ═══════════════════════════════════════════════════════════
   CURSOR GLOW (subtle ambient light that follows mouse)
   ═══════════════════════════════════════════════════════════ */
function initCursorGlow() {
    if ('ontouchstart' in window) return;
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;

    let x = -300, y = -300;
    document.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });

    function tick() {
        glow.style.left = x + 'px';
        glow.style.top = y + 'px';
        requestAnimationFrame(tick);
    }
    tick();
}

/* ═══════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function initNavigation() {
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('nav-toggle');
    const links = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

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

    // Active section highlighting
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const pos = window.scrollY + 100;
        sections.forEach(s => {
            const id = s.id;
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (link) {
                link.classList.toggle('active', pos >= s.offsetTop && pos < s.offsetTop + s.offsetHeight);
            }
        });
    }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   LIGHTBOX
   ═══════════════════════════════════════════════════════════ */
function initLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    const items = document.querySelectorAll('.gallery-item');
    let idx = 0;
    const data = [];

    items.forEach((item, i) => {
        const im = item.querySelector('img');
        const c = item.querySelector('.gallery-caption');
        data.push({ src: im.src, alt: im.alt, caption: c ? c.textContent : '' });
        item.addEventListener('click', () => { idx = i; open(); });
    });

    function open() {
        img.src = data[idx].src;
        img.alt = data[idx].alt;
        cap.textContent = data[idx].caption;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function close() { lb.classList.remove('active'); document.body.style.overflow = ''; }
    function nav(d) {
        idx = (idx + d + data.length) % data.length;
        img.style.opacity = '0';
        setTimeout(() => {
            img.src = data[idx].src;
            img.alt = data[idx].alt;
            cap.textContent = data[idx].caption;
            img.style.opacity = '1';
        }, 150);
    }

    document.getElementById('lightbox-close').addEventListener('click', close);
    document.getElementById('lightbox-prev').addEventListener('click', () => nav(-1));
    document.getElementById('lightbox-next').addEventListener('click', () => nav(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') nav(-1);
        if (e.key === 'ArrowRight') nav(1);
    });
}

/* ═══════════════════════════════════════════════════════════
   NEWSLETTER
   ═══════════════════════════════════════════════════════════ */
function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletter-email');
        const btn = document.getElementById('newsletter-submit');
        if (!email.value) return;
        btn.textContent = '✓ Saved!';
        btn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
        const subs = JSON.parse(localStorage.getItem('wa_subscribers') || '[]');
        subs.push({ email: email.value, date: new Date().toISOString() });
        localStorage.setItem('wa_subscribers', JSON.stringify(subs));
        email.value = '';
        setTimeout(() => { btn.textContent = 'Notify Me'; btn.style.background = ''; }, 3000);
    });
}

/* ═══════════════════════════════════════════════════════════
   SMOOTH SCROLL ANCHORS
   ═══════════════════════════════════════════════════════════ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            if (id === '#') return;
            const t = document.querySelector(id);
            if (!t) return;
            e.preventDefault();
            const navH = document.getElementById('main-nav').offsetHeight;
            window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
        });
    });
}

/* ═══════════════════════════════════════════════════════════
   3D TILT CARDS (GPU-accelerated perspective)
   Cards tilt toward cursor with perspective transform
   ═══════════════════════════════════════════════════════════ */
function initTiltCards() {
    if ('ontouchstart' in window) return;

    const cards = document.querySelectorAll('.feature-card, .world-card');
    cards.forEach(card => {
        card.style.transformStyle = 'preserve-3d';

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            card.style.transform = '';
            setTimeout(() => { card.style.transition = ''; }, 500);
        });
    });
}
