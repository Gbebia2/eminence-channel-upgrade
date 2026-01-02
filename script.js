if (!window.location.pathname.includes("admin.html")) {

// At the top of script.js
window.dbReady = new Promise(async (resolve, reject) => {
    let retries = 10;
    while ((!window.db || typeof window.db === 'undefined') && retries > 0) {
        await new Promise(res => setTimeout(res, 500));
        retries--;
    }
    if (window.db) resolve(window.db);
    else reject("Firebase DB not initialized.");
});

// ===============================
// PAGE INITIALIZATION ROUTER
// ===============================

// New initialization function for the dynamic content pages
async function initPostPages() {
    if (!window.db) {
        const postsContainer = document.getElementById('article-posts-container') || document.getElementById('video-posts-container');
        if (postsContainer) {
            postsContainer.innerHTML = '<p style="color:red;text-align:center;">FATAL ERROR: Firebase not initialized.</p>';
        }
        return;
    }
    loadAndRenderPosts();
}

// ===============================
// MOBILE MENU & DROPDOWN (No Change)
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menuDropdown = document.getElementById('mobile-menu-dropdown');
    const dropdownHeaders = document.querySelectorAll('.mobile-dropdown-header');

    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', () => {
            const isVisible = menuDropdown.style.display === 'block';
            menuDropdown.style.display = isVisible ? 'none' : 'block';
        });

        document.querySelectorAll('.mobile-nav-dropdown a').forEach(link => {
            link.addEventListener('click', () => {
                menuDropdown.style.display = 'none';
            });
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
                arrow.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
    });
});


// ===============================
// CAROUSEL LOGIC - FIXED! (No Change)
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const carouselContainer = document.getElementById('carousel-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const dotsContainer = document.getElementById('carousel-dots');

    if (!carouselContainer || !prevBtn || !nextBtn) {
        return;
    }

    const slides = Array.from(carouselContainer.getElementsByClassName('carousel-image'));
    const totalSlides = slides.length;
    let currentSlide = 0;

    /**
     * Updates the visible slide and the active dot indicator.
     */
    function showSlide(index) {
        if (index < 0) {
            currentSlide = totalSlides - 1;
        }
        else if (index >= totalSlides) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }

        slides.forEach((slide, i) => {
            if (i === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('active');
            if (i === currentSlide) {
                dot.classList.add('active');
            }
        });
    }

    /**
     * Moves the carousel to the next slide.
     */
    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    /**
     * Moves the carousel to the previous slide.
     */
    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    /**
     * Creates the dot indicators dynamically.
     */
    function createDots() {
        dotsContainer.innerHTML = '';
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            dot.setAttribute('data-index', index);
            dot.addEventListener('click', () => {
                showSlide(index);
            });
            dotsContainer.appendChild(dot);
        });
    }

    // --- Initial Setup and Event Listeners ---

    createDots();
    showSlide(currentSlide);

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
});


// ===============================
// DYNAMIC POSTS LOADER (No Change)
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

const MOCK_POSTS_DATA = [
    { id: '1', title: "Mock Post: Connect Firebase", category: "a-quick-word", scripture: "Psalm 121", content: "Please connect your Firebase credentials to load live data.", image: "https://placehold.co/800x450/4f46e5/ffffff?text=CONNECT+FIREBASE", date: new Date().toISOString().slice(0, 10) }
];

const MAX_SNIPPET_LENGTH = 150;

// Function to load and render approved comments for a specific post
async function loadAndRenderComments(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    if (!commentsList || !window.db) {
        return;
    }

    commentsList.innerHTML = '<p style="font-size: 0.85rem; color: var(--color-text-light);">Attempting to load approved comments...</p>';

    // Console log removed for final cleanup

    try {
        const snapshot = await window.db.collection('comments')
            .where('postId', '==', postId)
            .where('approved', '==', true)
            .orderBy('date', 'asc')
            .get();

        const comments = snapshot.docs.map(doc => doc.data());


        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="font-size: 0.85rem; color: var(--color-text-light);">No comments yet.</p>';
            return;
        }

        commentsList.innerHTML = `<h4>${comments.length} Comment${comments.length !== 1 ? 's' : ''}</h4>`;

        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'single-comment';

            const date = comment.date && comment.date.toDate ? comment.date.toDate().toLocaleString() : 'N/A';

            commentDiv.innerHTML = `
                <p><strong>${comment.name}</strong> <span style="font-size: 0.8em; color: var(--color-text-light);">on ${date}</span></p>
                <p>${comment.comment}</p>
            `;
            commentsList.appendChild(commentDiv);
        });

    } catch (error) {
        console.error("Error fetching or rendering comments:", error);
        commentsList.innerHTML = '<p style="color:red;">Error loading comments. Check console.</p>';
    }
}


async function loadAndRenderPosts() {
    const postsContainer = document.getElementById('article-posts-container') || document.getElementById('video-posts-container');

    if (!postsContainer || !POST_CATEGORY) return;

    postsContainer.innerHTML = '<p style="text-align: center; color: var(--color-primary);">Loading live content...</p>';

    let posts = [];

    // --- Data Fetching Logic ---
    if (window.db) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const snapshot = await window.db
                .collection('posts')
                .where('category', '==', POST_CATEGORY)
                .orderBy('date', 'desc')
                .get();

            posts = snapshot.docs.map(doc => {
                const data = doc.data();
                const dateString = data.date && data.date.toDate ? data.date.toDate().toLocaleDateString() : (data.date || 'N/A');
                return { id: doc.id, ...data, date: dateString };
            });

        } catch (error) {
            console.error("Error fetching posts:", error);
            postsContainer.innerHTML = '<p style="text-align:center;color:orange;">Connection OK, but data fetch failed. Showing mock data.</p>';
            posts = MOCK_POSTS_DATA.filter(p => p.category === POST_CATEGORY);
        }
    } else {
        postsContainer.innerHTML = '<p style="text-align:center;color:red;">FATAL ERROR: Firebase not initialized.</p>';
        posts = MOCK_POSTS_DATA.filter(p => p.category === POST_CATEGORY);
    }

    if (posts.length === 0) {
        postsContainer.innerHTML = '<p style="text-align:center;color:var(--color-text-light);">No entries available yet.</p>';
        return;
    }

    postsContainer.innerHTML = '';

    // --- Post Rendering and Comment/Snippet Logic ---
    posts.forEach(post => {
        const article = document.createElement('article');
        let innerHTML = '';

        if (POST_CATEGORY === 'monthly-broadcast') {
            const videoUrl = post.image || '';

            innerHTML = `
                <div class="video-item-container">
                    <h2>${post.title}</h2>
                    <p class="article-meta">Broadcast Date: ${post.date}</p>
                    <div class="video-wrapper">
                        <iframe src="${videoUrl}" frameborder="0" allowfullscreen title="${post.title}"></iframe>
                    </div>
                    <p class="video-description">${post.content}</p>
                </div>`;
            article.className = 'video-post-item';
        } else {
            const fullContent = post.content;
            const needsSnippet = fullContent.length > MAX_SNIPPET_LENGTH;

            const snippet = needsSnippet ? fullContent.substring(0, MAX_SNIPPET_LENGTH) + '...' : fullContent;
            const hiddenContent = needsSnippet ? `<span class="full-content" style="display:none;">${fullContent.substring(MAX_SNIPPET_LENGTH)}</span>` : '';

            const scriptureDisplay = post.scripture && post.scripture !== 'Private Entry'
                ? `Scripture: <strong>${post.scripture}</strong> | `
                : '';

            innerHTML = `
                <div class="article-header-dynamic">
                    <h2>${post.title}</h2>
                    <p class="article-meta">
                        ${scriptureDisplay} Posted: ${post.date}
                    </p>
                </div>
                <div class="article-body-dynamic">
                    <img src="${post.image}" alt="${post.title}" class="article-banner-image-dynamic"/>

                    <p class="post-content-area" data-post-id="${post.id}">
                        <span class="snippet">${snippet}</span>
                        ${hiddenContent}
                    </p>

                    ${needsSnippet ? `<a href="#" class="btn btn-primary read-more-btn" data-post-id="${post.id}" data-expanded="false">Read More »</a>` : ''}
                </div>

                <div class="comments-section" id="comments-for-${post.id}">
                    <h3>Leave a Comment</h3>
                    <form class="comment-form" data-post-id="${post.id}">
                        <input type="text" placeholder="Your Name" name="name" required>
                        <textarea placeholder="Your Comment" name="comment" rows="3" required></textarea>
                        <button type="submit" class="btn btn-secondary btn-small">Submit Comment</button>
                        <p class="comment-message" style="display:none;"></p>
                    </form>
                    <div class="comments-list" id="comments-list-${post.id}">
                        </div>
                </div>`;
            article.className = 'article-post-item';
        }

        article.innerHTML = innerHTML;
        postsContainer.appendChild(article);

        if (POST_CATEGORY !== 'monthly-broadcast') {
            loadAndRenderComments(post.id);
        }
    });

    // Attach event listeners after rendering
    attachPostListeners();
}


// ===============================
    // PRAYER REQUEST FORM (The "Easy Way" Mailto + Firebase)
    // ===============================
    async function initPrayerRequestPage() {
        if (!window.db) return;

        const form = document.querySelector('.request-form');
        const textarea = document.getElementById('prayer-request');
        const charCountDisplay = document.querySelector('.char-count');
        const maxLength = 600;

        if (!form || !textarea) return;

        const updateCount = () => {
            charCountDisplay.textContent = `${textarea.value.length} of ${maxLength} max characters`;
        };
        textarea.addEventListener('input', updateCount);

        form.addEventListener('submit', async (e) => {
            // Note: We DO NOT e.preventDefault() here so the mailto action triggers

            const formData = {
                firstName: document.getElementById('first-name').value,
                lastName: document.getElementById('last-name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                request: textarea.value,
                contactPreference: document.querySelector('input[name="contact-preference"]:checked').value,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                status: "NEW"
            };

            try {
                // Save to Firebase for record keeping
                await window.db.collection('requests').add(formData);
                console.log("Firebase Backup Successful");
            } catch (error) {
                console.error("Firebase Backup Error:", error);
            }

        // Hide message after 8 seconds
        setTimeout(() => { formMessage.style.display = 'none'; }, 8000);
    });
}

// ===============================
// POST INTERACTION LOGIC (New Functions)
// ===============================

// Helper function to handle Read More/Collapse action
function toggleReadMore(postId) {
    const btn = document.querySelector(`.read-more-btn[data-post-id="${postId}"]`);
    const contentArea = document.querySelector(`.post-content-area[data-post-id="${postId}"]`);

    if (!btn || !contentArea) return;

    const fullContentSpan = contentArea.querySelector('.full-content');
    const snippetSpan = contentArea.querySelector('.snippet');

    if (btn.dataset.expanded === 'false') {
        // Expand
        if (fullContentSpan) fullContentSpan.style.display = 'inline';
        if (snippetSpan) snippetSpan.style.display = 'inline';
        btn.textContent = 'Show Less «';
        btn.dataset.expanded = 'true';
    } else {
        // Collapse
        if (fullContentSpan) fullContentSpan.style.display = 'none';
        btn.textContent = 'Read More »';
        btn.dataset.expanded = 'false';
    }
}


// Function to handle comment submission
async function submitComment(e) {
    e.preventDefault();
    if (!window.db) return alert("Firebase not connected.");

    const form = e.target;
    const postId = form.getAttribute('data-post-id');
    const name = form.elements['name'].value;
    const commentText = form.elements['comment'].value;
    const messageDisplay = form.querySelector('.comment-message');

    messageDisplay.style.display = 'block';
    messageDisplay.textContent = 'Submitting...';

    const commentData = {
        postId: postId,
        name: name,
        comment: commentText,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        approved: false
    };

    try {
        await window.db.collection('comments').add(commentData);
        messageDisplay.textContent = 'Comment submitted for approval!';
        form.reset();
    } catch (error) {
        console.error("Error submitting comment:", error);
        messageDisplay.textContent = 'Error submitting comment. Try again.';
    }
    setTimeout(() => { messageDisplay.style.display = 'none'; }, 5000);
}


// Function to attach all new listeners
function attachPostListeners() {
    // Attach Read More listeners
    document.querySelectorAll('.read-more-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleReadMore(e.currentTarget.dataset.postId);
        });
    });

    // Attach Comment Form listeners
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', submitComment);
    });
}


    // ===============================
    // PAGE ROUTER / INITIALIZER
    // ===============================
    window.addEventListener('load', () => {
        const title = document.title;
        if (title.includes('Prayer Request')) initPrayerRequestPage();
        if (document.getElementById('article-posts-container') || document.getElementById('video-posts-container')) initPostPages();
    });
}

// Testimonial Auto-Slider Logic
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.testimonial-slide');
    const dotsContainer = document.getElementById('testimonial-dots');
    if (!slides.length) return;

    let currentIdx = 0;

    // Create dots
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

    // Auto-slide every 6 seconds
    setInterval(() => {
        let next = (currentIdx + 1) % slides.length;
        showTestimonial(next);
    }, 6000);
});