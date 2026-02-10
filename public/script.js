// ===== AUVEA Website JavaScript =====

const runAUVEA = () => {
    // Initialize all modules
    initNavbar();
    initSmoothScroll();
    initScrollAnimations();
    initCounterAnimation();
    initParticles();
    initMobileMenu();
    initContactForm();
    initScrollProgress();
    initParallax();
    initMagneticButtons();
    initTextReveal();
    initBlobAnimation();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAUVEA);
} else {
    runAUVEA();
}

// ===== Navbar Scroll Effect =====
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Update active link based on scroll position
        updateActiveLink();
    });
    
    function updateActiveLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// ===== Smooth Scrolling =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                const mobileToggle = document.getElementById('mobileToggle');
                navLinks.classList.remove('mobile-open');
                mobileToggle.classList.remove('active');
                document.body.style.overflow = '';
                
                // Smooth scroll to target
                const navbarHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== Scroll Animations (Intersection Observer) =====
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Trigger counter animation when stats section is visible
                if (entry.target.closest('.hero-stats')) {
                    animateCounters();
                }
            }
        });
    }, observerOptions);
    
    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });
}

// ===== Counter Animation =====
let countersAnimated = false;

function initCounterAnimation() {
    // Will be triggered by scroll animation
}

function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;
    
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

// ===== Particle Background =====
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 3 + 1}px;
        height: ${Math.random() * 3 + 1}px;
        background: rgba(99, 102, 241, ${Math.random() * 0.5 + 0.2});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: particleFloat ${Math.random() * 10 + 10}s linear infinite;
        opacity: ${Math.random() * 0.5 + 0.3};
    `;
    container.appendChild(particle);
}

// Add particle animation styles dynamically
const particleStyles = document.createElement('style');
particleStyles.textContent = `
    @keyframes particleFloat {
        0%, 100% {
            transform: translateY(0) translateX(0);
        }
        25% {
            transform: translateY(-20px) translateX(10px);
        }
        50% {
            transform: translateY(-40px) translateX(-10px);
        }
        75% {
            transform: translateY(-20px) translateX(20px);
        }
    }
`;
document.head.appendChild(particleStyles);

// ===== Mobile Menu =====
function initMobileMenu() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!mobileToggle || !navLinks) return;
    
    mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navLinks.classList.toggle('mobile-open');
        
        // Prevent body scroll when menu is open
        if (navLinks.classList.contains('mobile-open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
}

// ===== Contact Form with EmailJS =====
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    // Initialize EmailJS with your public key
    emailjs.init('hJQUnQelwghZGqAed');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Simple validation
        if (!data.name || !data.email || !data.message) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Update button state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;
        
        try {
            // Send notification email to you (auveastudios@gmail.com)
            await emailjs.send('service_9prb5cv', 'template_yym3h61', {
                from_name: data.name,
                from_email: data.email,
                company: data.company || 'Not provided',
                message: data.message
            });
            
            // Send auto-reply to the user
            try {
                await emailjs.send('service_9prb5cv', 'template_r0spzwa', {
                    to_name: data.name,
                    to_email: data.email
                });
            } catch (replyError) {
                console.log('Auto-reply failed:', replyError);
                // Continue even if auto-reply fails
            }
            
            showNotification('Thank you! Your message has been sent successfully.', 'success');
            form.reset();
        } catch (error) {
            console.error('EmailJS error:', error);
            showNotification('Something went wrong. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ===== Notification System =====
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#22c55e' : '#ef4444'};
        color: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 16px;
        font-weight: 500;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add notification animation styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    .notification button:hover {
        opacity: 1;
    }
`;
document.head.appendChild(notificationStyles);

// ===== Initialize Metric Bar Animations =====
document.addEventListener('DOMContentLoaded', () => {
    // Reset metric bars for animation
    const metricFills = document.querySelectorAll('.metric-fill');
    metricFills.forEach(fill => {
        const width = fill.style.width;
        fill.style.width = '0';
        
        setTimeout(() => {
            fill.style.width = width;
        }, 500);
    });
});

// ===== Typing Effect for Hero (Optional Enhancement) =====
function initTypingEffect() {
    const text = "Intelligent Automation";
    const element = document.querySelector('.gradient-text');
    if (!element || element.dataset.typed) return;
    
    element.dataset.typed = 'true';
    element.textContent = '';
    let index = 0;
    
    function type() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            setTimeout(type, 100);
        }
    }
    
    setTimeout(type, 1000);
}

// ===== Parallax Effect for Hero =====
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroVisual = document.querySelector('.hero-visual');
    
    if (heroVisual && scrolled < window.innerHeight) {
        heroVisual.style.transform = `translateY(${scrolled * 0.1}px)`;
    }
});

// ===== Cursor Glow Effect (Premium Touch) =====
function initCursorGlow() {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.style.cssText = `
        position: fixed;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 0;
        transition: opacity 0.3s;
    `;
    document.body.appendChild(glow);
    
    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
    
    document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
        glow.style.opacity = '1';
    });
}

// Initialize cursor glow on desktop only
if (window.matchMedia('(min-width: 1024px)').matches) {
    initCursorGlow();
}

// ===== Service Card Tilt Effect =====
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
});

// ===== Scroll Progress Indicator =====
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = `${scrolled}%`;
    });
}

// ===== Parallax Effect =====
function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        parallaxElements.forEach(el => {
            const speed = el.dataset.parallax || 0.5;
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
        
        // Parallax for hero section
        const hero = document.querySelector('.hero');
        if (hero && scrolled < window.innerHeight) {
            const heroContent = hero.querySelector('.hero-content');
            const heroVisual = hero.querySelector('.hero-visual');
            
            if (heroContent) {
                heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
                heroContent.style.opacity = 1 - (scrolled / 700);
            }
            if (heroVisual) {
                heroVisual.style.transform = `translateY(${scrolled * 0.15}px)`;
            }
        }
    });
}

// ===== Magnetic Button Effect =====
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-primary, .nav-cta');
    
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });
}

// ===== Text Reveal Animation =====
function initTextReveal() {
    const textElements = document.querySelectorAll('.text-reveal');
    
    textElements.forEach(el => {
        const text = el.textContent;
        el.innerHTML = `<span>${text}</span>`;
    });
}

// ===== Animated Background Blob =====
function initBlobAnimation() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    // Create blob elements
    const blob1 = document.createElement('div');
    blob1.className = 'blob';
    blob1.style.cssText = `
        position: absolute;
        top: 10%;
        right: 10%;
        width: 600px;
        height: 600px;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%);
        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
        filter: blur(60px);
        animation: morphBlob 20s ease-in-out infinite;
        pointer-events: none;
        z-index: 0;
    `;
    
    const blob2 = document.createElement('div');
    blob2.className = 'blob';
    blob2.style.cssText = `
        position: absolute;
        bottom: 20%;
        left: 5%;
        width: 400px;
        height: 400px;
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(34, 211, 238, 0.06) 100%);
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        filter: blur(50px);
        animation: morphBlob 25s ease-in-out infinite reverse;
        pointer-events: none;
        z-index: 0;
    `;
    
    hero.style.position = 'relative';
    hero.appendChild(blob1);
    hero.appendChild(blob2);
}

// ===== Enhanced Scroll Animations =====
function initEnhancedScrollAnimations() {
    const animateElements = document.querySelectorAll('.animate-slide-up, .animate-slide-left, .animate-slide-right, .animate-scale, .animate-rotate');
    
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
    
    animateElements.forEach(el => observer.observe(el));
}

// Initialize enhanced scroll animations
document.addEventListener('DOMContentLoaded', initEnhancedScrollAnimations);

// ===== Smooth Counter Animation with Easing =====
function animateValue(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const current = Math.floor(start + (range * easedProgress));
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ===== Mouse Trail Effect =====
function initMouseTrail() {
    const trail = [];
    const trailLength = 10;
    
    for (let i = 0; i < trailLength; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: fixed;
            width: ${10 - i}px;
            height: ${10 - i}px;
            background: rgba(14, 165, 233, ${0.5 - i * 0.04});
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            transition: transform 0.1s ease;
        `;
        document.body.appendChild(dot);
        trail.push(dot);
    }
    
    let mouseX = 0, mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function updateTrail() {
        let x = mouseX;
        let y = mouseY;
        
        trail.forEach((dot, index) => {
            const nextDot = trail[index + 1] || trail[0];
            
            dot.style.left = x + 'px';
            dot.style.top = y + 'px';
            
            x += (parseFloat(nextDot.style.left) - x) * 0.3;
            y += (parseFloat(nextDot.style.top) - y) * 0.3;
        });
        
        requestAnimationFrame(updateTrail);
    }
    
    updateTrail();
}

// Initialize mouse trail on desktop
if (window.matchMedia('(min-width: 1024px)').matches && window.matchMedia('(hover: hover)').matches) {
    // Uncomment below to enable mouse trail (can be resource intensive)
    // initMouseTrail();
}

// ===== Intersection Observer for Staggered Animations =====
const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const children = entry.target.children;
            Array.from(children).forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`;
                child.classList.add('visible');
            });
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.stagger-children').forEach(el => staggerObserver.observe(el));

// ===== Update cursor glow color =====
function initCursorGlow() {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.style.cssText = `
        position: fixed;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 0;
        transition: opacity 0.3s;
    `;
    document.body.appendChild(glow);
    
    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
    
    document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
        glow.style.opacity = '1';
    });
}
