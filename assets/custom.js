(() => {
    const STORAGE_KEY = "theme";
    const root = document.documentElement;
    const themeToggle = document.querySelector(".theme-toggle");

    const getSystemTheme = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    const getSavedTheme = () => {
        const savedTheme = window.localStorage.getItem(STORAGE_KEY);
        return savedTheme === "dark" || savedTheme === "light" ? savedTheme : null;
    };

    const getCurrentTheme = () => root.dataset.theme === "dark" ? "dark" : "light";

    const syncThemeToggleState = (theme) => {
        if (!themeToggle) return;

        const isDark = theme === "dark";
        themeToggle.setAttribute("aria-pressed", String(isDark));
        themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    };

    const applyTheme = (theme) => {
        root.dataset.theme = theme;
        syncThemeToggleState(theme);
    };

    const initialTheme = getSavedTheme() || getSystemTheme();
    applyTheme(initialTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
            window.localStorage.setItem(STORAGE_KEY, nextTheme);
            applyTheme(nextTheme);
        });
    }

    const navToggle = document.querySelector(".nav-toggle");
    const mobileNav = document.getElementById("mobile-nav");
    if (navToggle && mobileNav) {
        const setOpen = (open) => {
            navToggle.setAttribute("aria-expanded", String(open));
            navToggle.textContent = open ? "Close" : "Menu";
            mobileNav.classList.toggle("is-open", open);
        };
        navToggle.addEventListener("click", () => {
            const isOpen = mobileNav.classList.contains("is-open");
            setOpen(!isOpen);
        });
        mobileNav.addEventListener("click", (event) => {
            const link = event.target.closest("a[href^='#']");
            if (!link) return;
            event.preventDefault();
            const target = document.querySelector(link.getAttribute("href"));
            setOpen(false);
            if (!target) return;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const nav = document.querySelector(".nav");
                    const navHeight = nav ? nav.offsetHeight : 72;
                    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
                    window.scrollTo({ top, behavior: "instant" });
                    history.pushState(null, "", link.getAttribute("href"));
                });
            });
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && mobileNav.classList.contains("is-open")) {
                setOpen(false);
                navToggle.focus();
            }
        });
        window.addEventListener("resize", () => {
            if (window.innerWidth > 900 && mobileNav.classList.contains("is-open")) {
                setOpen(false);
            }
        }, { passive: true });
    }

    const navLinks = document.querySelectorAll("[data-nav-link]");
    const navSections = [
        document.getElementById("about"),
        document.getElementById("services"),
        document.getElementById("stack"),
        document.getElementById("work"),
        document.getElementById("contact"),
    ].filter(Boolean);
    if (navLinks.length && navSections.length) {
        const setActiveNav = (id) => {
            navLinks.forEach((link) => {
                link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
            });
        };
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveNav(entry.target.id);
                }
            });
        }, { rootMargin: "-80px 0px -60% 0px", threshold: 0 });
        navSections.forEach((section) => navObserver.observe(section));
    }

    const brand = document.querySelector(".brand");
    if (brand && navToggle && mobileNav) {
        brand.addEventListener("click", () => {
            if (mobileNav.classList.contains("is-open")) {
                const setOpen = (open) => {
                    navToggle.setAttribute("aria-expanded", String(open));
                    navToggle.textContent = open ? "Close" : "Menu";
                    mobileNav.classList.toggle("is-open", open);
                };
                setOpen(false);
            }
        });
    }

    const revealTargets = document.querySelectorAll(".card, .explore-item, .timeline-item, .panel");
    const prefersReducedMotionGlobal = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (revealTargets.length && !prefersReducedMotionGlobal) {
        revealTargets.forEach((el) => el.classList.add("reveal"));
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                }
            });
        }, { rootMargin: "0px 0px -40px 0px", threshold: 0.1 });
        revealTargets.forEach((el) => revealObserver.observe(el));
    }

    const canvas = document.getElementById("scatter-background");
    const ctx = canvas && canvas.getContext("2d");

    if (!canvas || !ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canUseHoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const getScatterColor = () => {
        const value = getComputedStyle(root).getPropertyValue("--scatter-color").trim();
        return value || "20, 52, 95";
    };

    const parseScatterColor = (colorValue) => {
        const channels = colorValue
            .split(",")
            .map((part) => Number.parseFloat(part.trim()))
            .filter((value) => Number.isFinite(value));

        if (channels.length < 3) {
            return { r: 20, g: 52, b: 95 };
        }

        return {
            r: Math.max(0, Math.min(255, channels[0])),
            g: Math.max(0, Math.min(255, channels[1])),
            b: Math.max(0, Math.min(255, channels[2])),
        };
    };

    let scatterColorCurrent = parseScatterColor(getScatterColor());

    const stepScatterColor = () => {
        const target = parseScatterColor(getScatterColor());

        if (prefersReducedMotion) {
            scatterColorCurrent = target;
            return;
        }

        const smoothing = 0.14;
        scatterColorCurrent = {
            r: scatterColorCurrent.r + (target.r - scatterColorCurrent.r) * smoothing,
            g: scatterColorCurrent.g + (target.g - scatterColorCurrent.g) * smoothing,
            b: scatterColorCurrent.b + (target.b - scatterColorCurrent.b) * smoothing,
        };
    };

    const getScatterColorString = () => `${scatterColorCurrent.r.toFixed(2)}, ${scatterColorCurrent.g.toFixed(2)}, ${scatterColorCurrent.b.toFixed(2)}`;

    const cursor = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        active: false,
    };

    let particles = [];
    let viewportWidth = 0;
    let viewportHeight = 0;
    let lastFrameTime = 0;
    let lastKnownWidth = window.innerWidth;
    let lastKnownHeight = window.innerHeight;
    let resizeRaf = 0;

    const getParticleCount = () => {
        if (window.innerWidth < 560) return 36;
        if (window.innerWidth < 900) return 58;
        return 92;
    };

    const randomVelocity = () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.018 + 0.014;

        return {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
        };
    };

    const makeBaseParticle = () => {
        const velocity = randomVelocity();

        return {
            baseX: Math.random() * viewportWidth,
            baseY: Math.random() * viewportHeight,
            velocityX: velocity.x,
            velocityY: velocity.y,
            driftPhase: Math.random() * Math.PI * 2,
            driftSpeed: Math.random() * 0.28 + 0.12,
            radius: Math.random() * 1.8 + 1.1,
            life: Math.random() * 5000,
            lifeEnd: Math.random() * 4000 + 7000,
        };
    };

    const getLifeFade = (particle) => Math.max(
        0,
        Math.min(
            Math.min(1, particle.life / 1200),
            Math.min(1, (particle.lifeEnd - particle.life) / 1800),
        ),
    );

    const makeParticle = () => {
        const base = makeBaseParticle();

        return {
            ...base,
            x: base.baseX,
            y: base.baseY,
            alpha: prefersReducedMotion ? 1 : getLifeFade(base),
            influence: 0,
        };
    };

    const setupCanvas = ({ regenerate = true } = {}) => {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;

        canvas.width = Math.floor(viewportWidth * ratio);
        canvas.height = Math.floor(viewportHeight * ratio);
        canvas.style.width = `${viewportWidth}px`;
        canvas.style.height = `${viewportHeight}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        if (regenerate) {
            particles = Array.from({ length: getParticleCount() }, makeParticle);
            return;
        }

        for (const p of particles) {
            p.baseX = Math.min(viewportWidth + 20, Math.max(-20, p.baseX));
            p.baseY = Math.min(viewportHeight + 20, Math.max(-20, p.baseY));
            p.x = p.baseX;
            p.y = p.baseY;
        }
    };

    const draw = (time = 0) => {
        const delta = lastFrameTime ? Math.min(time - lastFrameTime, 32) : 16;
        lastFrameTime = time;
        stepScatterColor();
        const scatterColor = getScatterColorString();

        ctx.clearRect(0, 0, viewportWidth, viewportHeight);

        const pullRadius = Math.min(220, Math.max(150, viewportWidth * 0.16));
        const connectionDistance = viewportWidth < 560 ? 95 : 135;
        const tick = time * 0.001;

        for (const p of particles) {
            if (!prefersReducedMotion) {
                p.life += delta;
                p.baseX += p.velocityX * delta + Math.cos(tick * p.driftSpeed + p.driftPhase) * 0.035;
                p.baseY += p.velocityY * delta + Math.sin(tick * p.driftSpeed + p.driftPhase) * 0.035;

                if (p.baseX < -20 || p.baseX > viewportWidth + 20) {
                    p.velocityX *= -1;
                    p.baseX = Math.min(viewportWidth + 20, Math.max(-20, p.baseX));
                }

                if (p.baseY < -20 || p.baseY > viewportHeight + 20) {
                    p.velocityY *= -1;
                    p.baseY = Math.min(viewportHeight + 20, Math.max(-20, p.baseY));
                }

                p.alpha += (getLifeFade(p) - p.alpha) * 0.08;

                if (p.life > p.lifeEnd && p.alpha < 0.04) {
                    const next = makeBaseParticle();
                    p.baseX = next.baseX;
                    p.baseY = next.baseY;
                    p.velocityX = next.velocityX;
                    p.velocityY = next.velocityY;
                    p.driftPhase = next.driftPhase;
                    p.driftSpeed = next.driftSpeed;
                    p.radius = next.radius;
                    p.life = 0;
                    p.lifeEnd = next.lifeEnd;
                    p.alpha = 0;
                    p.influence = 0;
                }
            } else {
                p.alpha = 1;
            }

            const dx = p.baseX - cursor.x;
            const dy = p.baseY - cursor.y;
            const distance = Math.hypot(dx, dy);
            const forceRaw = cursor.active ? Math.max(0, 1 - distance / pullRadius) : 0;
            const force = forceRaw * forceRaw * (3 - 2 * forceRaw);
            const push = force * 42;
            const angle = Math.atan2(dy, dx);

            p.x = p.baseX + Math.cos(angle) * push;
            p.y = p.baseY + Math.sin(angle) * push;
            p.influence += (force - p.influence) * 0.08;
        }

        for (let i = 0; i < particles.length; i += 1) {
            for (let j = i + 1; j < particles.length; j += 1) {
                const a = particles[i];
                const b = particles[j];
                const distance = Math.hypot(a.x - b.x, a.y - b.y);

                if (distance < connectionDistance) {
                    const influenceBoost = Math.max(a.influence || 0, b.influence || 0) * 0.34;
                    const lineAlpha = ((1 - distance / connectionDistance) * 0.2 + influenceBoost) * Math.min(a.alpha, b.alpha);

                    ctx.strokeStyle = `rgba(${scatterColor}, ${lineAlpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        for (const p of particles) {
            const alpha = (0.38 + (p.influence || 0) * 0.48) * p.alpha;
            const radius = p.radius + (p.influence || 0) * 2.6;

            ctx.fillStyle = `rgba(${scatterColor}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        if (!prefersReducedMotion) {
            requestAnimationFrame(draw);
        }
    };

    const isLikelyMobileViewportChange = (nextWidth, nextHeight) => {
        const widthDiff = Math.abs(nextWidth - lastKnownWidth);
        const heightDiff = Math.abs(nextHeight - lastKnownHeight);

        return !canUseHoverPointer && widthDiff < 8 && heightDiff > 0;
    };

    const handleResize = () => {
        if (resizeRaf) cancelAnimationFrame(resizeRaf);

        resizeRaf = requestAnimationFrame(() => {
            const nextWidth = window.innerWidth;
            const nextHeight = window.innerHeight;
            const shouldRegenerate = !isLikelyMobileViewportChange(nextWidth, nextHeight);

            lastKnownWidth = nextWidth;
            lastKnownHeight = nextHeight;
            setupCanvas({ regenerate: shouldRegenerate || particles.length !== getParticleCount() });
        });
    };

    setupCanvas();
    draw();

    if (!prefersReducedMotion) {
        window.addEventListener("resize", handleResize, { passive: true });

        if (canUseHoverPointer) {
            window.addEventListener("pointermove", (event) => {
                if (event.pointerType && event.pointerType !== "mouse") return;
                cursor.x = event.clientX;
                cursor.y = event.clientY;
                cursor.active = true;
            }, { passive: true });

            window.addEventListener("pointerleave", () => {
                cursor.active = false;
            });
        }
    }
})();
