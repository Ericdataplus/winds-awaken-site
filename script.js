/* ═══════════════════════════════════════════════════════════
   WINDS AWAKEN — Three.js + GSAP Premium Landing Page
   GPU-accelerated ocean, particles, bloom, scroll animations
   ═══════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ─── Globals ────────────────────────────────────────────── */
let mouse = { x: 0, y: 0, nx: 0, ny: 0 };
let scrollY = 0;

/* ─── Init Everything ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initThreeHero();
    initLenis();
    initGSAP();
    initCursorGlow();
    initNavigation();
    initLightbox();
    initNewsletterForm();
    initSmoothScroll();
});

/* ═══════════════════════════════════════════════════════════
   THREE.JS HERO SCENE
   ═══════════════════════════════════════════════════════════ */
function initThreeHero() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // ─── Ocean Plane ─────────────────────────────────────
    const oceanGeo = new THREE.PlaneGeometry(80, 80, 128, 128);
    const oceanMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor1: { value: new THREE.Color(0x0a2a3a) },
            uColor2: { value: new THREE.Color(0x1affcc) },
            uMouseX: { value: 0 },
            uMouseY: { value: 0 },
        },
        vertexShader: `
            uniform float uTime;
            uniform float uMouseX;
            uniform float uMouseY;
            varying vec2 vUv;
            varying float vElevation;

            void main() {
                vUv = uv;
                vec3 pos = position;

                // Layered waves
                float wave1 = sin(pos.x * 0.3 + uTime * 0.8) * 0.8;
                float wave2 = sin(pos.y * 0.5 + uTime * 0.6) * 0.5;
                float wave3 = sin((pos.x + pos.y) * 0.2 + uTime * 1.2) * 0.3;
                float mouseWave = sin(distance(pos.xy, vec2(uMouseX * 20.0, uMouseY * 20.0)) * 0.5 - uTime * 2.0) * 0.3;

                pos.z = wave1 + wave2 + wave3 + mouseWave;
                vElevation = pos.z;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform float uTime;
            varying vec2 vUv;
            varying float vElevation;

            void main() {
                // Mix colors based on elevation
                float mixFactor = smoothstep(-1.0, 1.5, vElevation);
                vec3 color = mix(uColor1, uColor2, mixFactor * 0.4);

                // Shimmer on wave peaks
                float shimmer = smoothstep(0.5, 1.5, vElevation) * 0.3;
                color += vec3(0.1, 1.0, 0.8) * shimmer;

                // Distance fade
                float dist = length(vUv - 0.5);
                float fade = smoothstep(0.6, 0.3, dist);

                gl_FragColor = vec4(color, fade * 0.7);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
    });

    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -3;
    scene.add(ocean);

    // ─── Bioluminescent Particle System ──────────────────
    const particleCount = 600;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    const colorPalette = [
        new THREE.Color(0x1affcc), // teal
        new THREE.Color(0x00dcff), // aqua
        new THREE.Color(0xf0c850), // gold
        new THREE.Color(0xff69b4), // pink
        new THREE.Color(0x50ff80), // green
    ];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 60;
        positions[i3 + 1] = Math.random() * 25 - 5;
        positions[i3 + 2] = (Math.random() - 0.5) * 60;

        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        sizes[i] = Math.random() * 3 + 1;
        speeds[i] = Math.random() * 0.5 + 0.2;
        phases[i] = Math.random() * Math.PI * 2;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: `
            attribute float size;
            uniform float uTime;
            uniform float uPixelRatio;
            varying vec3 vColor;

            void main() {
                vColor = color;
                vec3 pos = position;

                // Gentle floating motion
                pos.y += sin(uTime * 0.5 + position.x * 0.1) * 0.5;
                pos.x += cos(uTime * 0.3 + position.z * 0.1) * 0.3;

                vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * uPixelRatio * (80.0 / -mvPos.z);
                gl_Position = projectionMatrix * mvPos;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;

            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;

                // Soft glow falloff
                float glow = 1.0 - smoothstep(0.0, 0.5, dist);
                glow = pow(glow, 1.5);

                gl_FragColor = vec4(vColor, glow * 0.7);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ─── Ambient Lights ──────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x1a3050, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x1affcc, 2, 50);
    pointLight1.position.set(10, 10, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xf0c850, 1.5, 40);
    pointLight2.position.set(-10, 8, -5);
    scene.add(pointLight2);

    // ─── Post-Processing (Bloom) ─────────────────────────
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.8,  // strength
        0.4,  // radius
        0.85  // threshold
    );
    composer.addPass(bloomPass);

    // ─── Mouse Tracking ──────────────────────────────────
    document.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ─── Resize ──────────────────────────────────────────
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    // ─── Animation Loop ─────────────────────────────────
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();

        // Smooth mouse follow
        mouse.nx += (mouse.x - mouse.nx) * 0.05;
        mouse.ny += (mouse.y - mouse.ny) * 0.05;

        // Update ocean
        oceanMat.uniforms.uTime.value = elapsed;
        oceanMat.uniforms.uMouseX.value = mouse.nx;
        oceanMat.uniforms.uMouseY.value = mouse.ny;

        // Update particles
        particleMat.uniforms.uTime.value = elapsed;

        // Animate particle positions for drifting
        const posArr = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            posArr[i3] += speeds[i] * 0.02;
            posArr[i3 + 1] += Math.sin(elapsed * speeds[i] + phases[i]) * 0.005;

            // Wrap around
            if (posArr[i3] > 30) posArr[i3] = -30;
        }
        particleGeo.attributes.position.needsUpdate = true;

        // Camera reacts to mouse
        camera.position.x += (mouse.nx * 3 - camera.position.x) * 0.02;
        camera.position.y += (8 + mouse.ny * 2 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        // Fade scene on scroll
        const heroHeight = window.innerHeight;
        const scrollFade = Math.max(0, 1 - scrollY / heroHeight);
        renderer.domElement.style.opacity = scrollFade;

        // Render with bloom
        composer.render();
    }

    animate();
}

/* ═══════════════════════════════════════════════════════════
   LENIS SMOOTH SCROLL
   ═══════════════════════════════════════════════════════════ */
function initLenis() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    lenis.on('scroll', (e) => {
        scrollY = e.scroll;

        // Fade scroll hint
        const hint = document.getElementById('scroll-hint');
        if (hint) {
            hint.style.opacity = Math.max(0, 1 - scrollY / 200);
        }
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Connect to GSAP ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }
}

/* ═══════════════════════════════════════════════════════════
   GSAP SCROLL ANIMATIONS
   ═══════════════════════════════════════════════════════════ */
function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Animate all [data-animate] elements
    document.querySelectorAll('[data-animate]').forEach(el => {
        const type = el.getAttribute('data-animate');
        const delay = parseFloat(el.getAttribute('data-delay') || 0) * 0.12;

        const from = { opacity: 0 };
        if (type === 'fade-up') from.y = 50;
        if (type === 'slide-left') from.x = -60;
        if (type === 'slide-right') from.x = 60;

        gsap.from(el, {
            ...from,
            duration: 1,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                end: 'bottom 20%',
                toggleActions: 'play none none none',
            },
        });
    });

    // Parallax on world card images
    document.querySelectorAll('.world-img-wrapper img').forEach(img => {
        gsap.to(img, {
            yPercent: -15,
            ease: 'none',
            scrollTrigger: {
                trigger: img.closest('.world-card'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            },
        });
    });

    // Hero logo parallax on scroll
    const heroLogo = document.getElementById('hero-logo');
    if (heroLogo) {
        gsap.to(heroLogo, {
            y: -80,
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
            },
        });
    }

    // Section labels slide in
    gsap.utils.toArray('.section-label').forEach(label => {
        gsap.from(label, {
            x: -30,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: label,
                start: 'top 85%',
            },
        });
    });

    // Stats count up
    document.querySelectorAll('.stat-number').forEach(stat => {
        const text = stat.textContent;
        const num = parseInt(text);
        if (!isNaN(num)) {
            const obj = { val: 0 };
            gsap.to(obj, {
                val: num,
                duration: 2,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: stat,
                    start: 'top 85%',
                },
                onUpdate: () => {
                    stat.textContent = Math.round(obj.val);
                },
            });
        }
    });
}

/* ═══════════════════════════════════════════════════════════
   CURSOR GLOW
   ═══════════════════════════════════════════════════════════ */
function initCursorGlow() {
    if ('ontouchstart' in window) return;

    const glow = document.getElementById('cursor-glow');
    if (!glow) return;

    let glowX = -300, glowY = -300;

    document.addEventListener('mousemove', (e) => {
        glowX = e.clientX;
        glowY = e.clientY;
    });

    function animate() {
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        requestAnimationFrame(animate);
    }
    animate();
}

/* ═══════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function initNavigation() {
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('nav-toggle');
    const links = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
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

    // Active link
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const pos = window.scrollY + 100;
        sections.forEach(section => {
            const top = section.offsetTop;
            const h = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (link) {
                if (pos >= top && pos < top + h) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   LIGHTBOX
   ═══════════════════════════════════════════════════════════ */
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
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

    function navigate(dir) {
        currentIndex = (currentIndex + dir + images.length) % images.length;
        const data = images[currentIndex];
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = data.src;
            lightboxImg.alt = data.alt;
            lightboxCaption.textContent = data.caption;
            lightboxImg.style.opacity = '1';
        }, 200);
    }

    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev').addEventListener('click', () => navigate(-1));
    document.getElementById('lightbox-next').addEventListener('click', () => navigate(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
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

        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';

        const subs = JSON.parse(localStorage.getItem('wa_subscribers') || '[]');
        subs.push({ email: email.value, date: new Date().toISOString() });
        localStorage.setItem('wa_subscribers', JSON.stringify(subs));
        email.value = '';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 3000);
    });
}

/* ═══════════════════════════════════════════════════════════
   SMOOTH SCROLL ANCHORS
   ═══════════════════════════════════════════════════════════ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            const navH = document.getElementById('main-nav').offsetHeight;
            const top = target.getBoundingClientRect().top + window.scrollY - navH;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}
