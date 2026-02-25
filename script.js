// ==========================================
// FINAL CONSOLIDATED SCRIPT.JS
// ==========================================

// 1. DATABASE READY PROMISE
window.dbReady = new Promise(async (resolve, reject) => {
    let retries = 10;
    while ((!window.db || typeof window.db === 'undefined') && retries > 0) {
        await new Promise(res => setTimeout(res, 500));
        retries--;
    }
    if (window.db) resolve(window.db);
    else reject("Firebase DB not initialized.");
});

// 2. MAIN INITIALIZATION ROUTER
window.addEventListener('load', () => {
    initMobileMenu();
    initPhotoCarousel();
    initTestimonialCarousel();

    const title = document.title;
    if (title.includes('Prayer Request')) initPrayerRequestPage();
    if (document.getElementById('article-posts-container') || document.getElementById('video-posts-container')) initPostPages();

    // Dynamic Page Content
    loadAboutPageContent();
    loadHomePageContent();
    loadServicesPageContent();
});

// ===============================
// CORE SITE FEATURES
// ===============================

function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menuDropdown = document.getElementById('mobile-menu-dropdown');
    const dropdownHeaders = document.querySelectorAll('.mobile-dropdown-header');

    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', () => {
            const isVisible = menuDropdown.style.display === 'block';
            menuDropdown.style.display = isVisible ? 'none' : 'block';
        });
    }

    dropdownHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-target');
            const subMenu = document.getElementById(targetId);
            const arrow = header.querySelector('.arrow-icon');
            if (subMenu) {
                const isVisible = subMenu.style.display === 'block';
                subMenu.style.display = isVisible ? 'none' : 'block';
                if (arrow) arrow.style.transform = isVisible ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    });
}

function initPhotoCarousel() {
    const carouselContainer = document.getElementById('carousel-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const dotsContainer = document.getElementById('carousel-dots');

    if (!carouselContainer || !prevBtn || !nextBtn) return;

    const slides = Array.from(carouselContainer.getElementsByClassName('carousel-image'));
    const totalSlides = slides.length;
    let currentSlide = 0;

    function showSlide(index) {
        if (index < 0) currentSlide = totalSlides - 1;
        else if (index >= totalSlides) currentSlide = 0;
        else currentSlide = index;

        slides.forEach((slide, i) => slide.classList.toggle('active', i === currentSlide));

        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    }

    dotsContainer.innerHTML = '';
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.addEventListener('click', () => showSlide(index));
        dotsContainer.appendChild(dot);
    });

    showSlide(0);
    nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
    prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
}

function initTestimonialCarousel() {
    const slides = document.querySelectorAll('.testimonial-slide');
    const dotsContainer = document.getElementById('testimonial-dots');
    if (!slides.length || !dotsContainer) return;

    let currentIdx = 0;
    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => showTestimonial(i));
        dotsContainer.appendChild(dot);
    });

    function showTestimonial(index) {
        slides.forEach(s => s.classList.remove('active'));
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach(d => d.classList.remove('active'));
        currentIdx = index;
        slides[currentIdx].classList.add('active');
        dots[currentIdx].classList.add('active');
    }

    setInterval(() => showTestimonial((currentIdx + 1) % slides.length), 6000);
}

// ===============================
// BLOG & POSTS LOGIC
// ===============================

const POST_CATEGORY = (() => {
    const title = document.title;
    if (title.includes('A Quick Word')) return 'a-quick-word';
    if (title.includes('Pray Along With Me')) return 'pray-along-with-me';
    if (title.includes("Minister's Desk")) return 'ministers-desk';
    if (title.includes("Monthly Broadcast")) return 'monthly-broadcast';
    if (title.includes("Praying Psalms")) return 'praying-psalms';
    if (title.includes("My Secret Place")) return 'my-secret-place';
    if (title.includes("My Space")) return 'my-space';
    return null;
})();

async function initPostPages() {
    await window.dbReady;
    loadAndRenderPosts();
}

async function loadAndRenderPosts() {
    const postsContainer = document.getElementById('article-posts-container') || document.getElementById('video-posts-container');
    if (!postsContainer || !POST_CATEGORY) return;

    postsContainer.innerHTML = '<p style="text-align: center;">Loading live content...</p>';
    try {
        const db = await window.dbReady;
        const snapshot = await db.collection('posts').where('category', '==', POST_CATEGORY).orderBy('date', 'desc').get();
        const posts = snapshot.docs.map(doc => {
            const data = doc.data();
            // We still fetch the date for sorting purposes, but we won't display it
            return { id: doc.id, ...data };
        });

        if (posts.length === 0) {
            postsContainer.innerHTML = '<p style="text-align:center;">No entries available yet.</p>';
            return;
        }

        postsContainer.innerHTML = '';
        posts.forEach(post => {
            const article = document.createElement('article');
            if (POST_CATEGORY === 'monthly-broadcast') {
                article.className = 'video-post-item';
                article.innerHTML = `
                    <div class="video-item-container">
                        <h2>${post.title}</h2>
                        <div class="video-wrapper"><iframe src="${post.image}" frameborder="0" allowfullscreen></iframe></div>
                        <p class="video-description">${post.content}</p>
                    </div>`;
            } else {
                article.className = 'article-post-item';
                const fullText = post.content || '';
                const isLong = fullText.length > 150;
                const snippet = isLong ? fullText.substring(0, 150) + '...' : fullText;

                article.innerHTML = `
                    <div class="article-header-dynamic">
                        <h2>${post.title}</h2>
                        <p class="article-meta">${post.scripture ? 'Scripture: ' + post.scripture : ''}</p>
                    </div>
                    <div class="article-body-dynamic">
                        <img src="${post.image}" class="article-banner-image-dynamic"/>
                        <div class="post-content-area" id="content-${post.id}">
                            <div class="snippet">${snippet}</div>
                            <div class="full-content" style="display:none;">${fullText}</div>
                        </div>
                        ${isLong ? `<a href="#" class="read-more-btn" onclick="event.preventDefault(); toggleContent('${post.id}')">Read More »</a>` : ''}
                    </div>
                    <div class="comments-section">
                        <h3>Comments</h3>
                        <div id="comments-list-${post.id}"></div>
                        <form class="comment-form" onsubmit="handleComment(event, '${post.id}')">
                            <input type="text" name="name" placeholder="Your Name" required>
                            <textarea name="comment" placeholder="Your Comment" required></textarea>
                            <button type="submit" class="btn btn-secondary btn-small">Submit Comment</button>
                        </form>
                    </div>`;
            }
            postsContainer.appendChild(article);
            if (POST_CATEGORY !== 'monthly-broadcast') loadComments(post.id);
        });
    } catch (e) { console.error(e); }
}

window.toggleContent = (id) => {
    const area = document.getElementById(`content-${id}`);
    const snippet = area.querySelector('.snippet');
    const full = area.querySelector('.full-content');
    const btn = area.nextElementSibling;
    const isExpanded = full.style.display === 'block';

    full.style.display = isExpanded ? 'none' : 'block';
    snippet.style.display = isExpanded ? 'block' : 'none';
    btn.textContent = isExpanded ? 'Read More »' : 'Show Less «';
};

async function loadComments(postId) {
    const container = document.getElementById(`comments-list-${postId}`);
    const db = await window.dbReady;
    const snap = await db.collection('comments').where('postId', '==', postId).where('approved', '==', true).get();
    container.innerHTML = snap.docs.map(doc => `<div class="single-comment"><strong>${doc.data().name}:</strong> ${doc.data().comment}</div>`).join('');
}

window.handleComment = async (e, postId) => {
    e.preventDefault();
    const db = await window.dbReady;
    await db.collection('comments').add({
        postId,
        name: e.target.name.value,
        comment: e.target.comment.value,
        approved: false,
        date: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Comment submitted for approval!");
    e.target.reset();
};

// ===============================
// PRAYER REQUEST LOGIC
// ===============================

function initPrayerRequestPage() {
    const form = document.querySelector('.request-form');
    const textarea = document.getElementById('prayer-request');
    const charDisplay = document.querySelector('.char-count');
    if (!form || !textarea) return;

    textarea.addEventListener('input', () => {
        charDisplay.textContent = `${textarea.value.length} of 600 max characters`;
    });

    form.addEventListener('submit', async (e) => {
        const db = await window.dbReady;
        const data = {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            request: textarea.value,
            contactPreference: document.querySelector('input[name="contact-preference"]:checked').value,
            date: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('requests').add(data);
        alert("Your request has been received. God bless you.");
    });
}

// ===============================
// DYNAMIC PAGE LOADERS
// ===============================

async function loadHomePageContent() {
    const titleEl = document.getElementById('home-hero-title');
    if (!titleEl) return;
    try {
        const db = await window.dbReady;
        const doc = await db.collection('siteContent').doc('homePage').get();
        if (doc.exists) {
            const d = doc.data();
            document.getElementById('home-hero-tag').innerText = d.heroTag || '';
            titleEl.innerText = d.heroTitle || '';
            const desc = document.getElementById('home-hero-desc');
            desc.innerText = d.heroDesc || '';
            desc.setAttribute('style', "white-space: pre-wrap; font-family: 'Poppins', sans-serif;");
            document.getElementById('home-hero-img').src = d.heroImage || '';
            document.getElementById('pillar1-title').innerText = d.pillar1Title || '';
            document.getElementById('pillar1-desc').innerText = d.pillar1Desc || '';
            document.getElementById('pillar2-title').innerText = d.pillar2Title || '';
            document.getElementById('pillar2-desc').innerText = d.pillar2Desc || '';
            document.getElementById('pillar3-title').innerText = d.pillar3Title || '';
            document.getElementById('pillar3-desc').innerText = d.pillar3Desc || '';

            // Testimonial Logic (Must stay INSIDE the 'if (doc.exists)' block)
            const testimonialContainer = document.getElementById('testimonial-container');
            const dotsContainer = document.getElementById('testimonial-dots');

            if (d.testimonials && testimonialContainer) {
                testimonialContainer.innerHTML = '';
                dotsContainer.innerHTML = '';

                const testimonyArray = d.testimonials.split('|');

                testimonyArray.forEach((item, index) => {
                    const parts = item.split('~');
                    const text = parts[0] || "";
                    const author = parts[1] || "Anonymous";

                    const slide = document.createElement('div');
                    slide.className = `testimonial-slide ${index === 0 ? 'active' : ''}`;
                    slide.innerHTML = `
                        <p class="testimonial-text">"${text.trim()}"</p>
                        <h4 class="testimonial-author">— ${author.trim()}</h4>
                    `;
                    testimonialContainer.appendChild(slide);

                    const dot = document.createElement('span');
                    dot.className = `dot ${index === 0 ? 'active' : ''}`;
                    // The actual click logic is handled by your initTestimonialCarousel
                    dotsContainer.appendChild(dot);
                });

                // Restart the carousel logic to bind the new slides/dots
                initTestimonialCarousel();
            }
        }
    } catch (e) { console.error("Error loading Home Page:", e); }
}

async function loadAboutPageContent() {
    if (!document.title.includes('About Us')) return;
    try {
        const db = await window.dbReady;
        const doc = await db.collection('siteContent').doc('aboutPage').get();
        if (doc.exists) {
            const d = doc.data();
            document.getElementById('dynamic-hero-tag').innerText = d.heroTag || '';
            document.getElementById('dynamic-hero-title').innerText = d.heroTitle || '';
            const sum = document.getElementById('dynamic-hero-summary');
            sum.innerHTML = d.heroSummary || '';
            sum.setAttribute('style', "white-space: pre-wrap; font-family: 'Poppins', sans-serif; display: block;");
            document.getElementById('dynamic-mission').innerText = d.missionText || '';
            document.getElementById('dynamic-vision').innerText = d.visionText || '';
            const values = document.getElementById('dynamic-values');
            if (d.valuesList) values.innerHTML = d.valuesList.split('|').map(v => `<li>${v.trim()}</li>`).join('');
            const bio = document.getElementById('dynamic-bio');
            bio.innerHTML = d.bioText || '';
            bio.setAttribute('style', "white-space: pre-wrap; font-family: 'Poppins', sans-serif; display: block;");
            document.getElementById('dynamic-founder-img').src = d.founderImage || '';
            document.getElementById('dynamic-book-title').innerText = d.bookTitle || '';
            document.getElementById('dynamic-book-desc').innerText = d.bookDesc || '';
            document.getElementById('dynamic-book-img').src = d.bookImage || '';
        }
    } catch (e) { console.error(e); }
}

async function loadServicesPageContent() {
    if (!document.title.includes('Our Services')) return;
    try {
        const db = await window.dbReady;
        const doc = await db.collection('siteContent').doc('servicesPage').get();

        if (doc.exists) {
            const data = doc.data();

            // Hero Section
        const heroTitleEl = document.getElementById('services-hero-title');
        const heroDescEl = document.getElementById('services-hero-desc');
        const heroBgEl = document.getElementById('services-hero-bg');

        if (heroTitleEl) heroTitleEl.innerText = data.heroTitle || '';
        if (heroDescEl) heroDescEl.innerText = data.heroDesc || '';

        // Only update the background image URL, let CSS handle the positioning
        if (heroBgEl && data.heroBg) {
            heroBgEl.style.backgroundImage = `url('${data.heroBg}')`;
        }

            // Main Titles
            document.getElementById('services-main-title').innerText = data.mainTitle || '';
            document.getElementById('services-main-subtitle').innerText = data.mainSubtitle || '';

            // Service Cards
            document.getElementById('service1-title').innerText = data.s1Title || '';
            document.getElementById('service1-desc').innerText = data.s1Desc || '';
            document.getElementById('service1-img').src = data.s1Img || '';

            document.getElementById('service2-title').innerText = data.s2Title || '';
            document.getElementById('service2-desc').innerText = data.s2Desc || '';
            document.getElementById('service2-img').src = data.s2Img || '';

            document.getElementById('service3-title').innerText = data.s3Title || '';
            document.getElementById('service3-desc').innerText = data.s3Desc || '';
            document.getElementById('service3-img').src = data.s3Img || '';

            // Quote & Prayer Notes
            document.getElementById('dynamic-services-quote').innerText = data.scriptureQuote || '';
            document.getElementById('dynamic-notes-heading').innerText = data.notesHeading || '';

            const listEl = document.getElementById('dynamic-notes-list');
            if (data.notesList) {
                listEl.innerHTML = data.notesList.split('|').map(item => `<li>${item.trim()}</li>`).join('');
            }
        }
    } catch (error) {
        console.error("Error loading Services Page:", error);
    }
}