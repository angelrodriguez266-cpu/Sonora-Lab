document.addEventListener('DOMContentLoaded', () => {
    /* =====================================================
       1. NAVBAR STICKY, MENÚ MÓVIL Y SCROLL-SPY
    ===================================================== */
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const backToTop = document.getElementById('backToTop');

    const closeMobileMenu = () => {
        navToggle.classList.remove('is-open');
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('is-open');
        navToggle.classList.toggle('is-open', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('is-open') && !navbar.contains(e.target)) {
            closeMobileMenu();
        }
    });

    const handleScroll = () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 40);
        backToTop.classList.toggle('is-visible', y > 480);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Scroll-spy for active section in nav
    const sections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
        const spyObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = `#${entry.target.id}`;
                        navLinks.forEach(link => {
                            link.classList.toggle('active', link.getAttribute('href') === id);
                        });
                    }
                });
            },
            { rootMargin: '-35% 0px -55% 0px' }
        );

        sections.forEach(section => spyObserver.observe(section));
    }

    /* =====================================================
       2. SCROLL REVEAL ANIMATIONS
    ===================================================== */
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        revealEls.forEach(el => revealObserver.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
    }

    /* =====================================================
       3. CARRUSEL + REPRODUCTOR DE INSTRUMENTOS
    ===================================================== */
    const viewport = document.getElementById('carruselViewport');
    const prevBtn = document.querySelector('.carrusel-prev');
    const nextBtn = document.querySelector('.carrusel-next');
    const dotsContainer = document.getElementById('carruselDots');
    const instrumentCards = Array.from(document.querySelectorAll('.carrusel-item'));

    const nowPlaying = document.getElementById('nowPlaying');
    const nowPlayingStatus = document.getElementById('nowPlayingStatus');
    const nowPlayingName = document.getElementById('nowPlayingName');
    const stopAudioBtn = document.getElementById('stopAudioBtn');

    const getStepWidth = () => {
        const firstCard = instrumentCards[0];
        if (!firstCard) return 300;
        const style = window.getComputedStyle(firstCard.parentElement);
        const gap = parseFloat(style.columnGap || style.gap || '20') || 20;
        return firstCard.getBoundingClientRect().width + gap;
    };

    const getVisibleCount = () => {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1200) return 2;
        return 3;
    };

    let dots = [];

    const buildDots = () => {
        if (!dotsContainer) return;
        const pageCount = Math.max(1, instrumentCards.length - getVisibleCount() + 1);
        dotsContainer.innerHTML = '';
        dots = [];

        for (let i = 0; i < pageCount; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carrusel-dot';
            dot.setAttribute('aria-label', `Ir a instrumento ${i + 1}`);
            dot.addEventListener('click', () => {
                viewport.scrollTo({ left: i * getStepWidth(), behavior: 'smooth' });
            });
            dotsContainer.appendChild(dot);
            dots.push(dot);
        }
        updateActiveDot();
    };

    const updateActiveDot = () => {
        if (!dots.length) return;
        const step = getStepWidth();
        const index = Math.min(dots.length - 1, Math.max(0, Math.round(viewport.scrollLeft / step)));
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    };

    prevBtn.addEventListener('click', () => {
        viewport.scrollBy({ left: -getStepWidth(), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        viewport.scrollBy({ left: getStepWidth(), behavior: 'smooth' });
    });

    viewport.addEventListener('scroll', updateActiveDot, { passive: true });
    viewport.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            viewport.scrollBy({ left: getStepWidth(), behavior: 'smooth' });
        } else if (e.key === 'ArrowLeft') {
            viewport.scrollBy({ left: -getStepWidth(), behavior: 'smooth' });
        }
    });

    window.addEventListener('resize', buildDots);
    buildDots();

    // Audio playback state
    let currentAudio = null;
    let activeCard = null;

    const resetAudioUI = () => {
        if (activeCard) {
            activeCard.classList.remove('is-playing');
            activeCard.setAttribute('aria-pressed', 'false');
            activeCard = null;
        }
        nowPlaying.classList.remove('is-playing');
        nowPlayingStatus.textContent = 'Listo para sonar';
        nowPlayingName.textContent = 'Elige un instrumento';
        stopAudioBtn.hidden = true;
    };

    const stopCurrentAudio = () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        resetAudioUI();
    };

    stopAudioBtn.addEventListener('click', stopCurrentAudio);

    instrumentCards.forEach(card => {
        card.setAttribute('aria-pressed', 'false');

        card.addEventListener('click', () => {
            const soundPath = card.dataset.sound;
            const name = card.dataset.name;
            const family = card.dataset.family;
            if (!soundPath) return;

            // Toggle off if clicking the same active instrument
            if (activeCard === card && currentAudio && !currentAudio.paused) {
                stopCurrentAudio();
                return;
            }

            stopCurrentAudio();

            const audio = new Audio(soundPath);
            currentAudio = audio;
            activeCard = card;

            card.classList.add('is-playing');
            card.setAttribute('aria-pressed', 'true');
            nowPlaying.classList.add('is-playing');
            nowPlayingStatus.textContent = `Sonando · ${family}`;
            nowPlayingName.textContent = name;
            stopAudioBtn.hidden = false;

            audio.addEventListener('ended', () => {
                if (currentAudio === audio) {
                    currentAudio = null;
                    resetAudioUI();
                }
            });

            audio.play().catch(err => {
                console.warn('No se pudo reproducir el audio:', err);
                resetAudioUI();
            });
        });
    });

    /* =====================================================
       4. MODAL DE DETALLE DE EVENTOS
    ===================================================== */
    const eventModal = document.getElementById('eventModal');
    const eventModalImg = document.getElementById('eventModalImg');
    const eventModalDate = document.getElementById('eventModalDate');
    const eventModalPlace = document.getElementById('eventModalPlace');
    const eventModalTitle = document.getElementById('eventModalTitle');
    const eventModalDesc = document.getElementById('eventModalDesc');
    const eventInterestBtn = document.getElementById('eventInterestBtn');
    const eventCards = document.querySelectorAll('.lqv-card');

    let selectedEventTitle = '';

    const openEventModal = (card) => {
        selectedEventTitle = card.dataset.eventTitle || 'Evento Filarmed';
        eventModalTitle.textContent = selectedEventTitle;
        eventModalDate.textContent = card.dataset.eventDate || '';
        eventModalPlace.textContent = card.dataset.eventPlace || '';
        eventModalDesc.textContent = card.dataset.eventDesc || '';
        eventModalImg.src = card.dataset.eventImg || '';
        eventModalImg.alt = selectedEventTitle;

        eventModal.hidden = false;
        document.body.classList.add('no-scroll');
    };

    const closeEventModal = () => {
        eventModal.hidden = true;
        document.body.classList.remove('no-scroll');
    };

    eventCards.forEach(card => {
        card.addEventListener('click', () => openEventModal(card));
    });

    eventModal.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', closeEventModal);
    });

    eventInterestBtn.addEventListener('click', () => {
        closeEventModal();
        const contactSection = document.getElementById('contacto');
        const emailInput = document.getElementById('newsletterEmail');
        const feedback = document.getElementById('formFeedback');

        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
        setTimeout(() => {
            if (emailInput) emailInput.focus();
            if (feedback && selectedEventTitle) {
                feedback.className = 'form-feedback is-success';
                feedback.textContent = `Déjanos tu correo para avisarte sobre "${selectedEventTitle}".`;
            }
        }, 450);
    });

    /* =====================================================
       5. LIGHTBOX DE GALERÍA
    ===================================================== */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const galleryButtons = Array.from(document.querySelectorAll('.mom-foto'));

    let currentGalleryIndex = 0;

    const showGalleryItem = (index) => {
        currentGalleryIndex = (index + galleryButtons.length) % galleryButtons.length;
        const btn = galleryButtons[currentGalleryIndex];
        const img = btn.querySelector('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = `${btn.dataset.caption || img.alt} (${currentGalleryIndex + 1} / ${galleryButtons.length})`;
    };

    const openLightbox = (index) => {
        showGalleryItem(index);
        lightbox.hidden = false;
        document.body.classList.add('no-scroll');
    };

    const closeLightbox = () => {
        lightbox.hidden = true;
        document.body.classList.remove('no-scroll');
    };

    galleryButtons.forEach((btn, idx) => {
        btn.addEventListener('click', () => openLightbox(idx));
    });

    lightboxPrev.addEventListener('click', () => showGalleryItem(currentGalleryIndex - 1));
    lightboxNext.addEventListener('click', () => showGalleryItem(currentGalleryIndex + 1));

    lightbox.querySelectorAll('[data-close-lightbox]').forEach(el => {
        el.addEventListener('click', closeLightbox);
    });

    // Global keyboard shortcuts for modals & lightbox
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!eventModal.hidden) closeEventModal();
            if (!lightbox.hidden) closeLightbox();
            if (navMenu.classList.contains('is-open')) closeMobileMenu();
        }
        if (!lightbox.hidden) {
            if (e.key === 'ArrowLeft') showGalleryItem(currentGalleryIndex - 1);
            if (e.key === 'ArrowRight') showGalleryItem(currentGalleryIndex + 1);
        }
    });

    /* =====================================================
       6. FORMULARIO NEWSLETTER
    ===================================================== */
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmail = document.getElementById('newsletterEmail');
    const inputContainer = document.getElementById('inputContainer');
    const formFeedback = document.getElementById('formFeedback');

    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterEmail.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        inputContainer.classList.remove('has-error');

        if (!emailRegex.test(email)) {
            void inputContainer.offsetWidth; // trigger reflow for shake animation
            inputContainer.classList.add('has-error');
            formFeedback.className = 'form-feedback is-error';
            formFeedback.textContent = 'Por favor escribe un correo electrónico válido.';
            newsletterEmail.focus();
            return;
        }

        formFeedback.className = 'form-feedback is-success';
        formFeedback.textContent = `¡Listo! Registramos ${email} en la comunidad Sonora Lab.`;
        newsletterForm.reset();
    });
});
