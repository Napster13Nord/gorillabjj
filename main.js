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

    /* ─── THREE.JS REMOVED — using logo image background instead ─── */

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

    /* ─── CONTACT FORM ──────────────────────────── */
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('form-submit');
            const originalText = submitBtn.querySelector('span:first-child').textContent;

            submitBtn.disabled = true;
            submitBtn.querySelector('span:first-child').textContent = 'SENDING...';

            // Simulate send
            setTimeout(() => {
                submitBtn.querySelector('span:first-child').textContent = '✓ MESSAGE SENT';
                submitBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)';

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.querySelector('span:first-child').textContent = originalText;
                    submitBtn.style.background = '';
                    contactForm.reset();
                }, 3000);
            }, 1500);
        });
    }

    /* ─── NAVBAR CTA → SCROLL TO CONTACT ────────── */
    const navCta = document.getElementById('nav-cta');
    if (navCta) {
        navCta.addEventListener('click', () => {
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        });
    }

});
