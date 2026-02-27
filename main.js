/* ═══════════════════════════════════════════════════
   GORILLA JIU JITSU — MAIN JAVASCRIPT
   Three.js 3D scene, GSAP scroll animations,
   smoke effect, carousel, counters, interactions
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /* ─── LOADER ──────────────────────────────── */
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            animateHero();
        }, 800);
    });

    /* ─── THREE.JS 3D GORILLA MODEL ──────────── */
    function init3DGorilla() {
        if (typeof THREE === 'undefined') return;

        const canvas = document.getElementById('gorilla-canvas');
        const container = document.getElementById('hero-3d-container');
        if (!canvas || !container) return;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(0, 1.2, 4.5);
        camera.lookAt(0, 0.8, 0);

        scene.add(new THREE.AmbientLight(0x111111, 0.5));
        const keyLight = new THREE.DirectionalLight(0xD4A017, 2.5);
        keyLight.position.set(3, 5, 2);
        keyLight.castShadow = true;
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(0xF0C44A, 2.0);
        rimLight.position.set(-3, 3, -3);
        scene.add(rimLight);
        const fillLight = new THREE.DirectionalLight(0x1a1a3a, 0.8);
        fillLight.position.set(2, -1, 2);
        scene.add(fillLight);
        const accentLight = new THREE.PointLight(0xD4A017, 1.5, 10);
        accentLight.position.set(0, 2, 2);
        scene.add(accentLight);
        const coolRim = new THREE.DirectionalLight(0x334466, 0.6);
        coolRim.position.set(4, 1, -1);
        scene.add(coolRim);

        let gorillaModel = null;
        let mixer = null;

        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.load('c30d42aa9f8d4e23b8a0ee3ec41807c0.glb',
            (gltf) => {
                gorillaModel = gltf.scene;
                const box = new THREE.Box3().setFromObject(gorillaModel);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const targetSize = 1.7;
                const scale = targetSize / maxDim;
                gorillaModel.scale.setScalar(scale);
                box.setFromObject(gorillaModel);
                box.getCenter(center);
                gorillaModel.position.sub(center);
                gorillaModel.position.y += 0.3;
                gorillaModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material.metalness = 0.15;
                        child.material.roughness = 0.55;
                        child.material.envMapIntensity = 1.5;
                        child.material.needsUpdate = true;
                    }
                });
                scene.add(gorillaModel);
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(gorillaModel);
                    mixer.clipAction(gltf.animations[0]).play();
                }
                gorillaModel.scale.setScalar(0);
                if (typeof gsap !== 'undefined') {
                    gsap.to(gorillaModel.scale, { x: scale, y: scale, z: scale, duration: 1.8, ease: 'elastic.out(1, 0.6)', delay: 0.3 });
                } else {
                    gorillaModel.scale.setScalar(scale);
                }
            },
            null,
            (error) => console.warn('Error loading GLB model:', error)
        );

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        const envGeo = new THREE.SphereGeometry(5, 32, 32);
        const envMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide });
        envScene.add(new THREE.Mesh(envGeo, envMat));
        const envLight = new THREE.PointLight(0xD4A017, 2, 10);
        envLight.position.set(2, 3, 2);
        envScene.add(envLight);
        scene.environment = pmremGenerator.fromScene(envScene).texture;
        pmremGenerator.dispose();

        let currentRotY = 0, currentRotX = 0, targetRotY = 0, targetRotX = 0;
        const MAX_ROT_Y = Math.PI * 0.2;
        const MAX_ROT_X = Math.PI * 0.1;
        const DAMP = 0.06;

        document.addEventListener('mousemove', (e) => {
            targetRotY = ((e.clientX / window.innerWidth) - 0.5) * 2 * MAX_ROT_Y;
            targetRotX = ((e.clientY / window.innerHeight) - 0.5) * 2 * MAX_ROT_X;
        });

        const clock = new THREE.Clock();
        const baseY = 0.6;

        function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();
            currentRotY += (targetRotY - currentRotY) * DAMP;
            currentRotX += (targetRotX - currentRotX) * DAMP;
            if (gorillaModel) {
                gorillaModel.rotation.y = currentRotY;
                gorillaModel.rotation.x = currentRotX;
                gorillaModel.position.y = baseY + Math.sin(elapsed * 0.8) * 0.04;
            }
            accentLight.position.x = Math.sin(elapsed * 0.5) * 3;
            accentLight.position.z = Math.cos(elapsed * 0.5) * 3;
            accentLight.intensity = 1.5 + Math.sin(elapsed * 1.2) * 0.3;
            if (mixer) mixer.update(delta);
            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    function waitForThree(callback, retries = 30) {
        if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
            callback();
        } else if (retries > 0) {
            setTimeout(() => waitForThree(callback, retries - 1), 150);
        }
    }
    waitForThree(init3DGorilla);

    /* ─── SMOKE / FOG CANVAS EFFECT ──────────── */
    const smokeCanvas = document.getElementById('smoke-canvas');
    const smokeCtx = smokeCanvas.getContext('2d');

    function initSmoke() {
        smokeCanvas.width = window.innerWidth;
        smokeCanvas.height = window.innerHeight;
    }

    const smokeParticles = [];
    const SMOKE_COUNT = 40;

    class SmokeParticle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * smokeCanvas.width;
            this.y = smokeCanvas.height + Math.random() * 100;
            this.size = Math.random() * 200 + 80;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = -(Math.random() * 0.5 + 0.15);
            this.opacity = Math.random() * 0.06 + 0.01;
            this.life = 0;
            this.maxLife = Math.random() * 400 + 200;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life++;
            const progress = this.life / this.maxLife;
            this.currentOpacity = this.opacity * (1 - progress);
            this.size += 0.15;
            if (this.life >= this.maxLife) this.reset();
        }
        draw() {
            smokeCtx.save();
            smokeCtx.globalAlpha = this.currentOpacity;
            const gradient = smokeCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, 'rgba(212, 160, 23, 0.08)');
            gradient.addColorStop(0.5, 'rgba(120, 100, 60, 0.03)');
            gradient.addColorStop(1, 'transparent');
            smokeCtx.fillStyle = gradient;
            smokeCtx.beginPath();
            smokeCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            smokeCtx.fill();
            smokeCtx.restore();
        }
    }

    for (let i = 0; i < SMOKE_COUNT; i++) {
        const p = new SmokeParticle();
        p.life = Math.random() * p.maxLife;
        smokeParticles.push(p);
    }

    function animateSmoke() {
        requestAnimationFrame(animateSmoke);
        smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
        smokeParticles.forEach(p => { p.update(); p.draw(); });
    }
    initSmoke();
    animateSmoke();
    window.addEventListener('resize', initSmoke);

    /* ─── HERO ANIMATIONS ───────────────────────── */
    function animateHero() {
        if (typeof gsap === 'undefined') {
            document.querySelectorAll('.hero__title-line, .hero__subtitle, .hero__cta-group').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo('.hero__title-line--1', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9 }, 0.1)
          .fromTo('.hero__title-line--2', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9 }, 0.35)
          .fromTo('.hero__title-line--3', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.0, ease: 'power4.out' }, 0.6)
          .fromTo('.hero__subtitle',      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 1.0)
          .fromTo('.hero__cta-group',     { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 1.2);
    }

    /* ─── GSAP SCROLL ANIMATIONS ────────────────── */
    function initScrollAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('[data-animate]').forEach(el => {
            const delay = parseInt(el.dataset.delay || 0) * 0.12;
            const direction = el.dataset.animate;
            let x = 0, y = 0;
            if (direction === 'fade-up')    y = 50;
            if (direction === 'fade-right') x = -50;
            if (direction === 'fade-left')  x = 50;
            gsap.fromTo(el,
                { autoAlpha: 0, x, y },
                {
                    autoAlpha: 1, x: 0, y: 0,
                    duration: 0.8, ease: 'power2.out', delay,
                    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
                }
            );
        });
        document.querySelectorAll('.section__tag').forEach(tag => {
            gsap.to(tag, { y: -15, scrollTrigger: { trigger: tag, start: 'top 90%', end: 'bottom 20%', scrub: 1 } });
        });
        setTimeout(() => ScrollTrigger.refresh(), 500);
        window.addEventListener('load', () => ScrollTrigger.refresh());
    }

    function waitForGSAP(callback, retries = 20) {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            callback();
        } else if (retries > 0) {
            setTimeout(() => waitForGSAP(callback, retries - 1), 150);
        } else {
            callback();
        }
    }
    waitForGSAP(initScrollAnimations);

    /* ─── NAVBAR SCROLL BEHAVIOR ────────────────── */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        const scroll = window.scrollY;
        navbar.classList.toggle('scrolled', scroll > 50);
        const sections = document.querySelectorAll('.section, .hero');
        const navLinks = document.querySelectorAll('.navbar__link');
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            const bottom = top + section.offsetHeight;
            if (scroll >= top && scroll < bottom) {
                const id = section.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { passive: true });

    /* ─── MOBILE MENU ───────────────────────────── */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
            document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    /* ─── STAT COUNTER ANIMATION ────────────────── */
    function animateCounters() {
        const counters = document.querySelectorAll('[data-count]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count);
                    const duration = 2000;
                    const start = performance.now();
                    function tick(now) {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const ease = 1 - Math.pow(1 - progress, 3);
                        el.textContent = Math.round(target * ease);
                        if (progress < 1) requestAnimationFrame(tick);
                    }
                    requestAnimationFrame(tick);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(c => observer.observe(c));
    }
    animateCounters();

    /* ─── CARD 3D TILT ──────────────────────────── */
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6;
            const rotateY = ((x - rect.width  / 2) / (rect.width  / 2)) * 6;
            card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
            card.style.transition = 'transform 0.5s ease';
        });
        card.addEventListener('mouseenter', () => { card.style.transition = 'none'; });
    });

    /* ─── TESTIMONIAL CAROUSEL ──────────────────── */
    const track = document.getElementById('testimonial-track');
    const dotsContainer = document.getElementById('testimonial-dots');
    const prevBtn = document.getElementById('testimonial-prev');
    const nextBtn = document.getElementById('testimonial-next');
    if (track && dotsContainer) {
        const cards = track.querySelectorAll('.testimonial-card');
        let currentSlide = 0;
        const total = cards.length;
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('div');
            dot.className = `testimonials__dot${i === 0 ? ' active' : ''}`;
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
        function goToSlide(index) {
            currentSlide = index;
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            dotsContainer.querySelectorAll('.testimonials__dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
        prevBtn.addEventListener('click', () => goToSlide(currentSlide === 0 ? total - 1 : currentSlide - 1));
        nextBtn.addEventListener('click', () => goToSlide(currentSlide === total - 1 ? 0 : currentSlide + 1));
        let interval = setInterval(() => goToSlide(currentSlide === total - 1 ? 0 : currentSlide + 1), 6000);
        const carousel = document.getElementById('testimonial-carousel');
        carousel.addEventListener('mouseenter', () => clearInterval(interval));
        carousel.addEventListener('mouseleave', () => {
            interval = setInterval(() => goToSlide(currentSlide === total - 1 ? 0 : currentSlide + 1), 6000);
        });
        let touchStartX = 0;
        carousel.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
        carousel.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) { if (diff > 0) nextBtn.click(); else prevBtn.click(); }
        }, { passive: true });
    }

    /* ─── RIPPLE BUTTON EFFECT ──────────────────── */
    document.querySelectorAll('.btn--primary, .navbar__cta').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = this.querySelector('.btn-ripple');
            if (!ripple) return;
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top  = `${e.clientY - rect.top  - size / 2}px`;
            ripple.classList.remove('active');
            void ripple.offsetWidth;
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'none';
            void ripple.offsetWidth;
            ripple.style.animation = '';
        });
    });

    /* ─── SMOOTH SCROLL FOR ANCHOR LINKS ────────── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    /* ─── CONTACT FORM (FORMSPREE INTEGRATION) ──── */
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('form-submit');
            const originalText = submitBtn.querySelector('span:first-child').textContent;
            submitBtn.disabled = true;
            submitBtn.querySelector('span:first-child').textContent = 'SENDING...';
            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    submitBtn.querySelector('span:first-child').textContent = '✓ MESSAGE SENT';
                    submitBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)';
                    contactForm.reset();
                } else throw new Error('Error');
            } catch {
                submitBtn.querySelector('span:first-child').textContent = '❌ ERROR: TRY AGAIN';
                submitBtn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.querySelector('span:first-child').textContent = originalText;
                    submitBtn.style.background = '';
                }, 4000);
            }
        });
    }

    /* ─── NAVBAR CTA → SCROLL TO CONTACT ────────── */
    const navCta = document.getElementById('nav-cta');
    if (navCta) navCta.addEventListener('click', () => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }));

    /* ─── DEPTHDECK COVERFLOW CAROUSEL ─────────────── */
    (function initDepthCarousel() {
        const cards = document.querySelectorAll('.depth-carousel__card');
        const dotsContainer = document.getElementById('carousel-dots');
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        if (!cards.length || !dotsContainer) return;
        const totalCards = cards.length;
        let activeIndex = 0;
        let autoPlayTimer = null;
        let isAutoPlaying = true;
        function getConfig() {
            const w = window.innerWidth;
            if (w < 480) return { cardWidth: Math.min(w * 0.7, 280), cardHeight: Math.min(w * 0.7, 280) * 9 / 16, spacing: 45, verticalOffset: 8, scaleStep: 0.14, rotationDeg: -8, perspective: 800, brightnessStep: 0.15 };
            if (w < 900) return { cardWidth: Math.min(w * 0.45, 360), cardHeight: Math.min(w * 0.45, 360) * 9 / 16, spacing: 80, verticalOffset: 12, scaleStep: 0.12, rotationDeg: -12, perspective: 1200, brightnessStep: 0.1 };
            return { cardWidth: 420, cardHeight: 236, spacing: 160, verticalOffset: 20, scaleStep: 0.1, rotationDeg: -15, perspective: 1500, brightnessStep: 0.1 };
        }
        for (let i = 0; i < totalCards; i++) {
            const dot = document.createElement('button');
            dot.className = 'depth-carousel__dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => { stopAutoPlay(); goTo(i); });
            dotsContainer.appendChild(dot);
        }
        function updateDots() {
            dotsContainer.querySelectorAll('.depth-carousel__dot').forEach((d, i) => d.classList.toggle('active', i === activeIndex));
        }
        function layoutCards() {
            const cfg = getConfig();
            const stage = document.getElementById('carousel-stage');
            if (stage) { stage.style.perspective = cfg.perspective + 'px'; stage.style.minHeight = cfg.cardHeight + 80 + 'px'; }
            cards.forEach((card, index) => {
                const half = Math.floor(totalCards / 2);
                let rel = ((index - activeIndex + totalCards) % totalCards) - half;
                if (rel > totalCards / 2)  rel -= totalCards;
                if (rel < -totalCards / 2) rel += totalCards;
                const absPos = Math.abs(rel);
                const x = rel * cfg.spacing;
                const y = absPos * cfg.verticalOffset;
                const scale = Math.max(0.4, 1 - absPos * cfg.scaleStep);
                const rotY = rel * cfg.rotationDeg;
                const brightness = Math.max(0.3, 1 - absPos * cfg.brightnessStep);
                card.style.width = cfg.cardWidth + 'px';
                card.style.height = cfg.cardHeight + 'px';
                card.style.transform = `translateX(${x}px) translateY(${y}px) scale(${scale}) rotateY(${rotY}deg)`;
                card.style.filter = `brightness(${brightness})`;
                card.style.zIndex = 200 - absPos * 10;
                card.style.opacity = absPos > 3 ? '0' : '1';
                card.classList.toggle('active', rel === 0);
                card.onclick = () => { if (rel === 0) return; stopAutoPlay(); goTo((activeIndex + rel + totalCards) % totalCards); };
            });
        }
        function goTo(index) { activeIndex = index; layoutCards(); updateDots(); }
        function goNext() { goTo((activeIndex + 1) % totalCards); }
        function goPrev() { goTo((activeIndex - 1 + totalCards) % totalCards); }
        function stopAutoPlay() { isAutoPlaying = false; if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; } }
        function startAutoPlay() { if (!isAutoPlaying) return; autoPlayTimer = setInterval(goNext, 4000); }
        if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoPlay(); goPrev(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoPlay(); goNext(); });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft')  { stopAutoPlay(); goPrev(); }
            if (e.key === 'ArrowRight') { stopAutoPlay(); goNext(); }
        });
        window.addEventListener('resize', () => layoutCards());
        layoutCards();
        startAutoPlay();
    })();

    /* ─── GOLDEN ORB WEBGL ──────────── */
    (function initGoldenOrb() {
        const canvas = document.getElementById('orb-canvas');
        const container = document.querySelector('.hero__3d-container');
        if (!canvas || !container) return;
        const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
        if (!gl) return;

        const vert = `
            precision highp float;
            attribute vec2 position;
            attribute vec2 uv;
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
        `;
        const frag = `
            precision highp float;
            uniform float iTime; uniform vec3 iResolution; uniform float hover;
            uniform float hoverIntensity; uniform float pulseSpeed; uniform float glowIntensity; uniform float ringCount;
            varying vec2 vUv;
            #define PI 3.14159265359
            #define TAU 6.28318530718
            vec3 goldDeep   = vec3(0.55,0.35,0.02);
            vec3 goldMid    = vec3(0.85,0.65,0.10);
            vec3 goldBright = vec3(1.00,0.85,0.35);
            vec3 goldWhite  = vec3(1.00,0.97,0.80);
            vec3 hash33(vec3 p3) {
                p3 = fract(p3*vec3(0.1031,0.11369,0.13787));
                p3 += dot(p3,p3.yxz+19.19);
                return -1.0+2.0*fract(vec3(p3.x+p3.y,p3.x+p3.z,p3.y+p3.z)*p3.zyx);
            }
            float snoise3(vec3 p) {
                const float K1=0.333333333,K2=0.166666667;
                vec3 i=floor(p+(p.x+p.y+p.z)*K1);
                vec3 d0=p-(i-(i.x+i.y+i.z)*K2);
                vec3 e=step(vec3(0.),d0-d0.yzx);
                vec3 i1=e*(1.-e.zxy),i2=1.-e.zxy*(1.-e);
                vec3 d1=d0-(i1-K2),d2=d0-(i2-K1),d3=d0-0.5;
                vec4 h=max(0.6-vec4(dot(d0,d0),dot(d1,d1),dot(d2,d2),dot(d3,d3)),0.);
                vec4 n=h*h*h*h*vec4(dot(d0,hash33(i)),dot(d1,hash33(i+i1)),dot(d2,hash33(i+i2)),dot(d3,hash33(i+1.)));
                return dot(vec4(31.316),n);
            }
            float ring(float len,float r,float w){return smoothstep(w,0.,abs(len-r));}
            float orbitalSpark(vec2 uv,float radius,float speed,float offset,float size){
                float t=iTime*speed+offset;
                return smoothstep(size,0.,length(uv-vec2(cos(t),sin(t))*radius));
            }
            vec4 mainImage(vec2 fragCoord){
                vec2 center=iResolution.xy*0.5;
                float size=min(iResolution.x,iResolution.y)*1.12;
                vec2 uv=(fragCoord-center)/size*2.;
                float t=iTime*pulseSpeed;
                uv.x+=hover*hoverIntensity*0.05*sin(uv.y*6.+t);
                uv.y+=hover*hoverIntensity*0.05*cos(uv.x*6.+t);
                float len=length(uv),ang=atan(uv.y,uv.x);
                float pulse=0.5+0.5*sin(t*0.8);
                float coreRadius=0.28+pulse*0.03;
                float core=smoothstep(coreRadius+0.15,0.,len)*(0.85+0.15*pulse);
                float halo=pow(max(0.,1.-len*1.),2.8)*(0.7+0.3*pulse);
                float n1=snoise3(vec3(uv*2.5,t*0.4))*0.5+0.5;
                float n2=snoise3(vec3(uv*5.+3.7,t*0.7))*0.5+0.5;
                float noiseTex=n1*0.65+n2*0.35;
                float surfaceMask=smoothstep(coreRadius+0.05,coreRadius-0.05,len);
                float r1=ring(len,0.36,0.010)*1.0;
                float r2=(ringCount>=2.)?ring(len,0.50,0.008)*0.8:0.;
                float r3=(ringCount>=3.)?ring(len,0.64,0.007)*0.6:0.;
                float s1=pow(max(0.,sin(ang-t*2.5)),8.),s2=pow(max(0.,sin(ang+t*1.8+2.1)),8.),s3=pow(max(0.,sin(ang-t*0.9+4.5)),8.);
                float rings=r1*(0.3+s1*0.7)+r2*(0.3+s2*0.7)+r3*(0.3+s3*0.7);
                float sparks=0.;
                sparks+=orbitalSpark(uv,0.36,1.8,0.00,0.02)*2.;
                sparks+=orbitalSpark(uv,0.36,1.8,PI,0.018)*1.5;
                sparks+=orbitalSpark(uv,0.50,-1.2,1.05,0.018)*1.6;
                sparks+=orbitalSpark(uv,0.50,-1.2,3.80,0.015)*1.2;
                sparks+=orbitalSpark(uv,0.64,0.7,0.52,0.016)*1.1;
                sparks+=orbitalSpark(uv,0.64,0.7,2.61,0.013)*0.9;
                sparks+=orbitalSpark(uv,0.64,0.7,4.71,0.012)*0.7;
                float rays=0.;
                for(float i=0.;i<6.;i++){float rayAng=i*TAU/6.+t*0.15;float diff=abs(mod(ang-rayAng+PI,TAU)-PI);rays+=smoothstep(0.2,0.,diff)*smoothstep(0.8,0.2,len)*0.5;}
                rays*=(0.5+0.5*sin(t*0.6));
                vec3 col=goldDeep*halo*2.5+mix(goldMid,goldWhite,noiseTex*surfaceMask+(1.-surfaceMask)*0.3)*core*2.5+goldBright*rings*3.5+goldWhite*sparks*3.5+goldMid*rays*1.5;
                col*=glowIntensity;
                float alpha=smoothstep(0.,0.85,max(max(col.r,col.g),col.b));
                return vec4(col,clamp(alpha*1.3,0.,1.));
            }
            void main(){gl_FragColor=mainImage(vUv*iResolution.xy);}
        `;

        function mkShader(type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
            return s;
        }
        const vs = mkShader(gl.VERTEX_SHADER, vert);
        const fs = mkShader(gl.FRAGMENT_SHADER, frag);
        if (!vs || !fs) return;
        const prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return; }
        gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
        const uvBuf  = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,2,0,0,2]),     gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog,'position'), aUv = gl.getAttribLocation(prog,'uv');
        const uTime = gl.getUniformLocation(prog,'iTime'), uRes = gl.getUniformLocation(prog,'iResolution');
        const uHover = gl.getUniformLocation(prog,'hover'), uHoverInt = gl.getUniformLocation(prog,'hoverIntensity');
        const uPulse = gl.getUniformLocation(prog,'pulseSpeed'), uGlow = gl.getUniformLocation(prog,'glowIntensity'), uRing = gl.getUniformLocation(prog,'ringCount');
        let targetHover = 0, currentHover = 0;
        container.addEventListener('mousemove', (e) => {
            const r = container.getBoundingClientRect();
            const uvX = ((e.clientX - r.left) / r.width) * 2 - 1;
            const uvY = ((e.clientY - r.top)  / r.height) * 2 - 1;
            targetHover = Math.sqrt(uvX * uvX + uvY * uvY) < 0.8 ? 1 : 0;
        });
        container.addEventListener('mouseleave', () => targetHover = 0);
        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        window.addEventListener('resize', resize);
        resize();
        function render(t) {
            requestAnimationFrame(render);
            currentHover += (targetHover - currentHover) * 0.08;
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(prog);
            gl.uniform1f(uTime, t * 0.001); gl.uniform3f(uRes, canvas.width, canvas.height, canvas.width / canvas.height);
            gl.uniform1f(uHover, currentHover); gl.uniform1f(uHoverInt, 0.3); gl.uniform1f(uPulse, 1.0); gl.uniform1f(uGlow, 2.2); gl.uniform1f(uRing, 3.0);
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);  gl.enableVertexAttribArray(aUv);  gl.vertexAttribPointer(aUv,  2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        requestAnimationFrame(render);
    })();

    /* ─── GLITCH TEXT EFFECT ────────────── */
    (function initGlitch() {
        const beforeLayer = document.querySelector('.glitch-layer--before');
        const afterLayer  = document.querySelector('.glitch-layer--after');
        const glitchWrap  = document.querySelector('.glitch-wrap');
        if (!beforeLayer || !afterLayer) return;
        const clipPaths = [
            'inset(10% 0 85% 0)','inset(45% 0 40% 0)','inset(80% 0 5% 0)',
            'inset(10% 0 60% 0)','inset(70% 0 20% 0)','inset(25% 0 50% 0)',
            'inset(55% 0 35% 0)','inset(5% 0 75% 0)','inset(90% 0 2% 0)',
            'inset(30% 0 55% 0)','inset(15% 0 70% 0)','inset(65% 0 25% 0)',
            'inset(40% 0 45% 0)','inset(85% 0 10% 0)','inset(20% 0 65% 0)',
            'inset(50% 0 30% 0)','inset(75% 0 15% 0)','inset(35% 0 52% 0)',
            'inset(60% 0 28% 0)','inset(8% 0 82% 0)'
        ];
        let frame = 0, hoverInterval = null, nextBurstTimeout = null, isHovering = false;
        function startContinuousGlitch() {
            if (hoverInterval) return;
            beforeLayer.style.opacity = '1'; afterLayer.style.opacity = '1';
            hoverInterval = setInterval(() => {
                frame = (frame + 1) % clipPaths.length;
                afterLayer.style.clipPath  = clipPaths[frame];
                beforeLayer.style.clipPath = clipPaths[(frame + 10) % clipPaths.length];
            }, (0.5 * 1000) / clipPaths.length);
        }
        function stopContinuousGlitch() {
            if (hoverInterval) { clearInterval(hoverInterval); hoverInterval = null; }
            beforeLayer.style.opacity = '0'; afterLayer.style.opacity = '0';
        }
        function doGlitchBurst() {
            if (isHovering) return;
            const speed = 0.4 + Math.random() * 0.4;
            const intervalMs = (speed * 1000) / clipPaths.length;
            const burstDuration = 150 + Math.random() * 350;
            beforeLayer.style.opacity = '1'; afterLayer.style.opacity = '1';
            let burstInterval = setInterval(() => {
                frame = (frame + 1) % clipPaths.length;
                afterLayer.style.clipPath  = clipPaths[frame];
                beforeLayer.style.clipPath = clipPaths[(frame + 10) % clipPaths.length];
            }, intervalMs);
            setTimeout(() => {
                clearInterval(burstInterval);
                if (!isHovering) {
                    beforeLayer.style.opacity = '0'; afterLayer.style.opacity = '0';
                    nextBurstTimeout = setTimeout(doGlitchBurst, 3000 + Math.random() * 3000);
                }
            }, burstDuration);
        }
        if (glitchWrap) {
            glitchWrap.style.cursor = 'crosshair';
            glitchWrap.addEventListener('mouseenter', () => { isHovering = true; clearTimeout(nextBurstTimeout); startContinuousGlitch(); });
            glitchWrap.addEventListener('mouseleave', () => { isHovering = false; stopContinuousGlitch(); nextBurstTimeout = setTimeout(doGlitchBurst, 2000); });
        }
        nextBurstTimeout = setTimeout(doGlitchBurst, 1500);
    })();

    /* ═══════════════════════════════════════════════════
       PREMIUM EFFECTS — Lenis, Custom Cursor, Magnetic
       ═══════════════════════════════════════════════════ */

    /* ─── LENIS SMOOTH SCROLL ───────────────────────── */
    (function initLenis() {
        if (typeof Lenis === 'undefined') { setTimeout(initLenis, 100); return; }
        const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        lenis.on('scroll', () => { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update(); });
    })();

    /* ─── CUSTOM CURSOR ─────────────────────────────── */
    (function initCursor() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        const outer = document.querySelector('.cursor--outer');
        const inner = document.querySelector('.cursor--inner');
        const trail = document.querySelector('.cursor--trail');
        if (!outer || !inner) return;
        let mx = window.innerWidth / 2, my = window.innerHeight / 2;
        let ox = mx, oy = my, ix = mx, iy = my, tx = mx, ty = my;
        document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        (function tick() {
            ox += (mx - ox) * 0.12; oy += (my - oy) * 0.12;
            ix += (mx - ix) * 0.35; iy += (my - iy) * 0.35;
            tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;
            outer.style.transform = `translate(${ox}px,${oy}px) translate(-50%,-50%)`;
            inner.style.transform = `translate(${ix}px,${iy}px) translate(-50%,-50%)`;
            if (trail) trail.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
            requestAnimationFrame(tick);
        })();
        document.querySelectorAll('a, button, .btn, .tech-card, .why-card, .stat-card, .depth-carousel__card').forEach(el => {
            el.addEventListener('mouseenter', () => { outer.classList.add('hover'); inner.classList.add('hover'); });
            el.addEventListener('mouseleave', () => { outer.classList.remove('hover'); inner.classList.remove('hover'); });
        });
        document.addEventListener('mousedown', () => outer.classList.add('click'));
        document.addEventListener('mouseup',   () => outer.classList.remove('click'));
    })();

    /* ─── MAGNETIC BUTTONS ──────────────────────────── */
    (function initMagnetic() {
        if (typeof gsap === 'undefined') return;
        document.querySelectorAll('.btn--primary, .btn--ghost, .navbar__cta').forEach(btn => {
            btn.addEventListener('mousemove', e => {
                const r = btn.getBoundingClientRect();
                gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.3, ease: 'power2.out' });
            });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
            });
        });
    })();

});
