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

        // ── Renderer ──
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // ── Scene ──
        const scene = new THREE.Scene();

        // ── Camera ──
        const camera = new THREE.PerspectiveCamera(
            40,
            container.clientWidth / container.clientHeight,
            0.1,
            100
        );
        camera.position.set(0, 1.2, 4.5);
        camera.lookAt(0, 0.8, 0);

        // ── Cinematic Lighting (sleek gold/dark) ──

        // Ambient — very subtle dark fill
        const ambient = new THREE.AmbientLight(0x111111, 0.5);
        scene.add(ambient);

        // Key light — warm gold from top-right
        const keyLight = new THREE.DirectionalLight(0xD4A017, 2.5);
        keyLight.position.set(3, 5, 2);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        scene.add(keyLight);

        // Rim light — strong gold/amber from behind-left for edge glow
        const rimLight = new THREE.DirectionalLight(0xF0C44A, 2.0);
        rimLight.position.set(-3, 3, -3);
        scene.add(rimLight);

        // Cool fill light from below-right for depth
        const fillLight = new THREE.DirectionalLight(0x1a1a3a, 0.8);
        fillLight.position.set(2, -1, 2);
        scene.add(fillLight);

        // Accent point light — gold glow emanating near the model
        const accentLight = new THREE.PointLight(0xD4A017, 1.5, 10);
        accentLight.position.set(0, 2, 2);
        scene.add(accentLight);

        // Secondary rim — subtle cool blue from the right for sleek contrast
        const coolRim = new THREE.DirectionalLight(0x334466, 0.6);
        coolRim.position.set(4, 1, -1);
        scene.add(coolRim);

        // ── Load GLB Model ──
        let gorillaModel = null;
        let mixer = null;

        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.load(
            'c30d42aa9f8d4e23b8a0ee3ec41807c0.glb',
            (gltf) => {
                gorillaModel = gltf.scene;

                // Auto-scale and center the model
                const box = new THREE.Box3().setFromObject(gorillaModel);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                const maxDim = Math.max(size.x, size.y, size.z);
                const targetSize = 1.7; // increased size slightly
                const scale = targetSize / maxDim;
                gorillaModel.scale.setScalar(scale);

                // Re-center after scaling
                box.setFromObject(gorillaModel);
                box.getCenter(center);
                gorillaModel.position.sub(center);
                gorillaModel.position.y += 0.3; // slight lift

                // Apply sleek material enhancements
                gorillaModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        if (child.material) {
                            // Enhance material for sleek look
                            child.material.metalness = 0.15;
                            child.material.roughness = 0.55;
                            child.material.envMapIntensity = 1.5;
                            child.material.needsUpdate = true;
                        }
                    }
                });

                scene.add(gorillaModel);

                // Handle animations if model has them
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(gorillaModel);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.play();
                }

                // Initial reveal animation with GSAP
                gorillaModel.scale.setScalar(0);
                if (typeof gsap !== 'undefined') {
                    gsap.to(gorillaModel.scale, {
                        x: scale,
                        y: scale,
                        z: scale,
                        duration: 1.8,
                        ease: 'elastic.out(1, 0.6)',
                        delay: 0.3
                    });
                } else {
                    gorillaModel.scale.setScalar(scale);
                }
            },
            (progress) => {
                // Loading progress (optional)
            },
            (error) => {
                console.warn('Error loading GLB model:', error);
            }
        );

        // ── Environment map for reflections ──
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        // Create a subtle gradient environment
        const envGeo = new THREE.SphereGeometry(5, 32, 32);
        const envMat = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            side: THREE.BackSide
        });
        envScene.add(new THREE.Mesh(envGeo, envMat));
        // Add gold point for reflection
        const envLight = new THREE.PointLight(0xD4A017, 2, 10);
        envLight.position.set(2, 3, 2);
        envScene.add(envLight);
        const envMap = pmremGenerator.fromScene(envScene).texture;
        scene.environment = envMap;
        pmremGenerator.dispose();

        // ── Mouse tracking — gorilla looks at cursor ──
        let currentRotY = 0, currentRotX = 0;
        let targetRotY = 0, targetRotX = 0;
        const MAX_ROT_Y = Math.PI * 0.2;  // ±35° so it never shows its back
        const MAX_ROT_X = Math.PI * 0.1;  // ±18° vertical tilt
        const DAMP = 0.06; // smooth damping

        document.addEventListener('mousemove', (e) => {
            // Map mouse position to rotation targets
            // targetRotY: mouse right -> look right
            targetRotY = ((e.clientX / window.innerWidth) - 0.5) * 2 * MAX_ROT_Y;
            // targetRotX: mouse down -> look down
            targetRotX = ((e.clientY / window.innerHeight) - 0.5) * 2 * MAX_ROT_X;
        });

        // ── Animation Loop ──
        const clock = new THREE.Clock();
        let baseY = 0.6; // Moved up slightly from 0.3

        function animate() {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            // Smooth damped rotation toward mouse (no auto-rotate)
            currentRotY += (targetRotY - currentRotY) * DAMP;
            currentRotX += (targetRotX - currentRotX) * DAMP;

            if (gorillaModel) {
                gorillaModel.rotation.y = currentRotY;
                gorillaModel.rotation.x = currentRotX;

                // Subtle floating animation
                gorillaModel.position.y = baseY + Math.sin(elapsed * 0.8) * 0.04;
            }

            // Animate accent light orbit
            accentLight.position.x = Math.sin(elapsed * 0.5) * 3;
            accentLight.position.z = Math.cos(elapsed * 0.5) * 3;
            accentLight.intensity = 1.5 + Math.sin(elapsed * 1.2) * 0.3;

            // Update animation mixer
            if (mixer) mixer.update(delta);

            renderer.render(scene, camera);
        }

        animate();

        // ── Resize Handler ──
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    // Wait for Three.js to load then init
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
        constructor() {
            this.reset();
        }
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
            const gradient = smokeCtx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size
            );
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
        p.life = Math.random() * p.maxLife; // stagger
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
            // Fallback: just show everything
            document.querySelectorAll('.hero__title-line, .hero__subtitle, .hero__cta-group').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.to('.hero__title-line--1', { opacity: 1, y: 0, duration: 0.8 }, 0.2)
            .to('.hero__title-line--2', { opacity: 1, y: 0, duration: 0.8 }, 0.5)
            .to('.hero__title-line--3', { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, 0.8)
            .to('.hero__subtitle', { opacity: 1, y: 0, duration: 0.7 }, 1.2)
            .to('.hero__cta-group', { opacity: 1, y: 0, duration: 0.7 }, 1.5);
    }

    /* ─── GSAP SCROLL ANIMATIONS ────────────────── */
    function initScrollAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            // Fallback — just show everything
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
            if (direction === 'fade-up') y = 50;
            if (direction === 'fade-right') x = -50;
            if (direction === 'fade-left') x = 50;

            // Use fromTo for better reliability with ScrollTrigger
            gsap.fromTo(el,
                { autoAlpha: 0, x: x, y: y },
                {
                    autoAlpha: 1,
                    x: 0,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    delay: delay,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        // Toggle actions: onEnter, onLeave, onEnterBack, onLeaveBack
                        toggleActions: 'play none none reverse',
                    }
                }
            );
        });

        // Parallax subtle effect on section tags
        document.querySelectorAll('.section__tag').forEach(tag => {
            gsap.to(tag, {
                y: -15,
                scrollTrigger: {
                    trigger: tag,
                    start: 'top 90%',
                    end: 'bottom 20%',
                    scrub: 1,
                }
            });
        });

        // Refresh ScrollTrigger after fonts/images load to fix calculation bugs
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 500);
        window.addEventListener('load', () => ScrollTrigger.refresh());
    }

    // Wait for GSAP to load
    function waitForGSAP(callback, retries = 20) {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            callback();
        } else if (retries > 0) {
            setTimeout(() => waitForGSAP(callback, retries - 1), 150);
        } else {
            callback(); // fallback path
        }
    }

    waitForGSAP(initScrollAnimations);

    /* ─── NAVBAR SCROLL BEHAVIOR ────────────────── */
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const scroll = window.scrollY;

        if (scroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active section highlight
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

        lastScroll = scroll;
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
                        // Ease out cubic
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
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
            card.style.transition = 'transform 0.5s ease';
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
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

        // Create dots
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

        prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide === 0 ? total - 1 : currentSlide - 1);
        });

        nextBtn.addEventListener('click', () => {
            goToSlide(currentSlide === total - 1 ? 0 : currentSlide + 1);
        });

        // Auto-advance every 6s
        let interval = setInterval(() => {
            goToSlide(currentSlide === total - 1 ? 0 : currentSlide + 1);
        }, 6000);

        // Pause on hover
        const carousel = document.getElementById('testimonial-carousel');
        carousel.addEventListener('mouseenter', () => clearInterval(interval));
        carousel.addEventListener('mouseleave', () => {
            interval = setInterval(() => {
                goToSlide(currentSlide === total - 1 ? 0 : currentSlide + 1);
            }, 6000);
        });

        // Swipe on touch
        let touchStartX = 0;
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) nextBtn.click();
                else prevBtn.click();
            }
        }, { passive: true });
    }

    /* ─── RIPPLE BUTTON EFFECT ──────────────────── */
    document.querySelectorAll('.btn--primary, .navbar__cta').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const ripple = this.querySelector('.btn-ripple');
            if (!ripple) return;

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            ripple.classList.remove('active');
            // Force reflow
            void ripple.offsetWidth;
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'none';
            void ripple.offsetWidth;
            ripple.style.animation = '';
        });
    });

    /* ─── SMOOTH SCROLL FOR ANCHOR LINKS ────────── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ─── CONTACT FORM (FORMSPREE INTEGRATION) ──── */
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('form-submit');
            const originalText = submitBtn.querySelector('span:first-child').textContent;

            submitBtn.disabled = true;
            submitBtn.querySelector('span:first-child').textContent = 'SENDING...';

            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    submitBtn.querySelector('span:first-child').textContent = '✓ MESSAGE SENT';
                    submitBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)';
                    contactForm.reset();
                } else {
                    throw new Error('Formspree returned error');
                }
            } catch (error) {
                console.error("Form submission error:", error);
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
    if (navCta) {
        navCta.addEventListener('click', () => {
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        });
    }
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

        // Responsive config
        function getConfig() {
            const w = window.innerWidth;
            if (w < 480) return {
                cardWidth: Math.min(w * 0.55, 180),
                cardHeight: 270,
                spacing: 35,
                verticalOffset: 8,
                scaleStep: 0.14,
                rotationDeg: -8,
                perspective: 800,
                brightnessStep: 0.15
            };
            if (w < 900) return {
                cardWidth: Math.min(w * 0.35, 250),
                cardHeight: 375,
                spacing: 70,
                verticalOffset: 15,
                scaleStep: 0.12,
                rotationDeg: -12,
                perspective: 1200,
                brightnessStep: 0.1
            };
            return {
                cardWidth: 280,
                cardHeight: 420,
                spacing: 130,
                verticalOffset: 25,
                scaleStep: 0.1,
                rotationDeg: -15,
                perspective: 1500,
                brightnessStep: 0.1
            };
        }

        // Build dots
        for (let i = 0; i < totalCards; i++) {
            const dot = document.createElement('button');
            dot.className = 'depth-carousel__dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => { stopAutoPlay(); goTo(i); });
            dotsContainer.appendChild(dot);
        }

        function updateDots() {
            dotsContainer.querySelectorAll('.depth-carousel__dot').forEach((d, i) => {
                d.classList.toggle('active', i === activeIndex);
            });
        }

        function layoutCards() {
            const cfg = getConfig();
            const stage = document.getElementById('carousel-stage');
            if (stage) {
                stage.style.perspective = cfg.perspective + 'px';
                stage.style.minHeight = cfg.cardHeight + 80 + 'px';
            }

            cards.forEach((card, index) => {
                const half = Math.floor(totalCards / 2);
                let rel = ((index - activeIndex + totalCards) % totalCards) - half;
                if (rel > totalCards / 2) rel -= totalCards;
                if (rel < -totalCards / 2) rel += totalCards;

                const absPos = Math.abs(rel);
                const x = rel * cfg.spacing;
                const y = absPos * cfg.verticalOffset;
                const scale = Math.max(0.4, 1 - absPos * cfg.scaleStep);
                const rotY = rel * cfg.rotationDeg;
                const brightness = Math.max(0.3, 1 - absPos * cfg.brightnessStep);
                const zIndex = 200 - absPos * 10;
                const isCenter = rel === 0;

                card.style.width = cfg.cardWidth + 'px';
                card.style.height = cfg.cardHeight + 'px';
                card.style.transform = `translateX(${x}px) translateY(${y}px) scale(${scale}) rotateY(${rotY}deg)`;
                card.style.setProperty('--card-transform', `translateX(${x}px) translateY(${y}px) scale(${scale}) rotateY(${rotY}deg)`);
                card.style.filter = `brightness(${brightness})`;
                card.style.zIndex = zIndex;
                card.style.opacity = absPos > 3 ? '0' : '1';
                card.classList.toggle('active', isCenter);

                // Click handler for side cards
                card.onclick = () => {
                    if (rel === 0) return;
                    stopAutoPlay();
                    goTo((activeIndex + rel + totalCards) % totalCards);
                };
            });
        }

        function goTo(index) {
            activeIndex = index;
            layoutCards();
            updateDots();
        }

        function goNext() { goTo((activeIndex + 1) % totalCards); }
        function goPrev() { goTo((activeIndex - 1 + totalCards) % totalCards); }

        function stopAutoPlay() {
            isAutoPlaying = false;
            if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
        }

        function startAutoPlay() {
            if (!isAutoPlaying) return;
            autoPlayTimer = setInterval(goNext, 4000);
        }

        // Arrow buttons
        if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoPlay(); goPrev(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoPlay(); goNext(); });

        // Keyboard navigation
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { stopAutoPlay(); goPrev(); }
            if (e.key === 'ArrowRight') { stopAutoPlay(); goNext(); }
        });

        // Responsive resize
        window.addEventListener('resize', () => layoutCards());

        // Init
        layoutCards();
        startAutoPlay();
    })();

});
