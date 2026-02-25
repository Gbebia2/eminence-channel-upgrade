document.addEventListener('DOMContentLoaded', async () => {

    async function waitForDb(timeout = 5000) {
        const interval = 250;
        let waited = 0;
        while (!window.db && waited < timeout) {
            await new Promise(resolve => setTimeout(resolve, interval));
            waited += interval;
        }
        return window.db;
    }

    const db = await waitForDb();

    // --- CRITICAL UI ELEMENTS ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    // These three lines are what were missing and likely caused the break:
    const postsListContainer = document.getElementById('posts-list');
    const requestsListContainer = document.getElementById('requests-list');
    const commentsListContainer = document.getElementById('comments-list-admin');

    const showDashboard = () => {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadPosts();
        loadRequests();
        loadComments();
        loadCurrentSettings();
    };

    const showLogin = (errorMessage = null) => {
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'block';
        if (errorMessage) {
            const loginError = document.getElementById('login-error');
            loginError.textContent = errorMessage;
            loginError.style.display = 'block';
        }
    };

    // --- AUTHENTICATION ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            try {
                await firebase.auth().signInWithEmailAndPassword(email, password);
            } catch (error) {
                showLogin(`Login failed: ${error.message}`);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => firebase.auth().signOut());
    }

    firebase.auth().onAuthStateChanged(user => {
        if (user) showDashboard();
        else showLogin();
    });

    // --- LOAD ALL PAGE SETTINGS ---
    async function loadCurrentSettings() {
        if (!db) return;

        // Home Page
        const homeDoc = await db.collection('siteContent').doc('homePage').get();
        if (homeDoc.exists) {
            const h = homeDoc.data();
            document.getElementById('set-home-tag').value = h.heroTag || '';
            document.getElementById('set-home-title').value = h.heroTitle || '';
            document.getElementById('set-home-desc').value = h.heroDesc || '';
            document.getElementById('set-home-img').value = h.heroImage || '';
            document.getElementById('set-home-testimonials').value = h.testimonials || '';
            document.getElementById('set-pillar1-title').value = h.pillar1Title || '';
            document.getElementById('set-pillar1-desc').value = h.pillar1Desc || '';
            document.getElementById('set-pillar2-title').value = h.pillar2Title || '';
            document.getElementById('set-pillar2-desc').value = h.pillar2Desc || '';
            document.getElementById('set-pillar3-title').value = h.pillar3Title || '';
            document.getElementById('set-pillar3-desc').value = h.pillar3Desc || '';
        }

        // About Page
        const aboutDoc = await db.collection('siteContent').doc('aboutPage').get();
        if (aboutDoc.exists) {
            const d = aboutDoc.data();
            document.getElementById('set-hero-tag').value = d.heroTag || '';
            document.getElementById('set-hero-title').value = d.heroTitle || '';
            document.getElementById('set-hero-summary').value = d.heroSummary || '';
            document.getElementById('set-mission').value = d.missionText || '';
            document.getElementById('set-vision').value = d.visionText || '';
            document.getElementById('set-values').value = d.valuesList || '';
            document.getElementById('set-bio').value = d.bioText || '';
            document.getElementById('set-image').value = d.founderImage || '';
            document.getElementById('set-book-title').value = d.bookTitle || '';
            document.getElementById('set-book-desc').value = d.bookDesc || '';
            document.getElementById('set-book-img').value = d.bookImage || '';
        }

        // Services Page
        const servDoc = await db.collection('siteContent').doc('servicesPage').get();
        if (servDoc.exists) {
            const s = servDoc.data();
            document.getElementById('set-serv-hero-title').value = s.heroTitle || '';
            document.getElementById('set-serv-hero-desc').value = s.heroDesc || '';
            document.getElementById('set-serv-hero-bg').value = s.heroBg || '';
            document.getElementById('set-serv-main-title').value = s.mainTitle || '';
            document.getElementById('set-serv-main-subtitle').value = s.mainSubtitle || '';
            document.getElementById('set-s1-title').value = s.s1Title || '';
            document.getElementById('set-s1-desc').value = s.s1Desc || '';
            document.getElementById('set-s1-img').value = s.s1Img || '';
            document.getElementById('set-s2-title').value = s.s2Title || '';
            document.getElementById('set-s2-desc').value = s.s2Desc || '';
            document.getElementById('set-s2-img').value = s.s2Img || '';
            document.getElementById('set-s3-title').value = s.s3Title || '';
            document.getElementById('set-s3-desc').value = s.s3Desc || '';
            document.getElementById('set-s3-img').value = s.s3Img || '';
            document.getElementById('set-serv-quote').value = s.scriptureQuote || '';
            document.getElementById('set-serv-notes-heading').value = s.notesHeading || '';
            document.getElementById('set-serv-notes-list').value = s.notesList || '';
        }
    }

    // --- FORM SUBMISSIONS ---
    document.getElementById('home-settings-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('save-home-btn');
        saveBtn.textContent = 'Saving...';
        try {
            const homeData = {
                heroTag: document.getElementById('set-home-tag').value,
                heroTitle: document.getElementById('set-home-title').value,
                heroDesc: document.getElementById('set-home-desc').value,
                heroImage: document.getElementById('set-home-img').value,
                testimonials: document.getElementById('set-home-testimonials').value,
                pillar1Title: document.getElementById('set-pillar1-title').value,
                pillar1Desc: document.getElementById('set-pillar1-desc').value,
                pillar2Title: document.getElementById('set-pillar2-title').value,
                pillar2Desc: document.getElementById('set-pillar2-desc').value,
                pillar3Title: document.getElementById('set-pillar3-title').value,
                pillar3Desc: document.getElementById('set-pillar3-desc').value
            };
            await db.collection('siteContent').doc('homePage').update(homeData);
            alert("Home Page updated successfully!");
        } catch (err) { alert("Error saving: " + err.message); }
        finally { saveBtn.textContent = 'Save Home Page Changes'; }
    });

    document.getElementById('services-settings-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-services-btn');
        btn.textContent = 'Saving...';
        try {
            const data = {
                heroTitle: document.getElementById('set-serv-hero-title').value,
                heroDesc: document.getElementById('set-serv-hero-desc').value,
                heroBg: document.getElementById('set-serv-hero-bg').value,
                mainTitle: document.getElementById('set-serv-main-title').value,
                mainSubtitle: document.getElementById('set-serv-main-subtitle').value,
                s1Title: document.getElementById('set-s1-title').value,
                s1Desc: document.getElementById('set-s1-desc').value,
                s1Img: document.getElementById('set-s1-img').value,
                s2Title: document.getElementById('set-s2-title').value,
                s2Desc: document.getElementById('set-s2-desc').value,
                s2Img: document.getElementById('set-s2-img').value,
                s3Title: document.getElementById('set-s3-title').value,
                s3Desc: document.getElementById('set-s3-desc').value,
                s3Img: document.getElementById('set-s3-img').value,
                scriptureQuote: document.getElementById('set-serv-quote').value,
                notesHeading: document.getElementById('set-serv-notes-heading').value,
                notesList: document.getElementById('set-serv-notes-list').value
            };
            await db.collection('siteContent').doc('servicesPage').update(data);
            alert("Services Page updated!");
        } catch (err) { alert("Error: " + err.message); }
        finally { btn.textContent = 'Save Services Page Changes'; }
    });

    document.getElementById('site-settings-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('save-settings-btn');
        saveBtn.textContent = 'Saving...';
        try {
            const updatedData = {
                heroTag: document.getElementById('set-hero-tag').value,
                heroTitle: document.getElementById('set-hero-title').value,
                heroSummary: document.getElementById('set-hero-summary').value,
                missionText: document.getElementById('set-mission').value,
                visionText: document.getElementById('set-vision').value,
                valuesList: document.getElementById('set-values').value,
                bioText: document.getElementById('set-bio').value,
                founderImage: document.getElementById('set-image').value,
                bookTitle: document.getElementById('set-book-title').value,
                bookDesc: document.getElementById('set-book-desc').value,
                bookImage: document.getElementById('set-book-img').value
            };
            await db.collection('siteContent').doc('aboutPage').update(updatedData);
            alert("About Page updated successfully!");
        } catch (err) { alert("Error saving: " + err.message); }
        finally { saveBtn.textContent = 'Save All About Page Changes'; }
    });

    // --- POSTS LOGIC ---
    function renderPosts(posts) {
    if (!postsListContainer) return;
    postsListContainer.innerHTML = '<h3>Existing Posts</h3>';
    if (posts.length === 0) {
        postsListContainer.innerHTML += '<p>No posts found.</p>';
        return;
    }
    posts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'post-item';
        item.innerHTML = `
            <span>[${post.category.toUpperCase()}] ${post.title}</span>
            <div class="post-item-actions">
                <button class="btn btn-secondary edit-btn" data-id="${post.id}">Edit</button>
                <button class="btn btn-primary delete-btn" data-id="${post.id}">Delete</button>
            </div>
        `;
        postsListContainer.appendChild(item);
    });
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editPost(btn.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deletePost(btn.dataset.id));
        });
    }

    async function loadPosts() {
        if (!db || !postsListContainer) return;
        postsListContainer.innerHTML = '<h3>Loading posts...</h3>';
        try {
            const snapshot = await db.collection('posts').orderBy('date', 'desc').get();
            const posts = snapshot.docs.map(doc => {
                const data = doc.data();
                const dateString = data.date && data.date.toDate ? data.date.toDate().toLocaleDateString() : 'N/A';
                return { id: doc.id, ...data, date: dateString };
            });
            renderPosts(posts);
        } catch (error) { console.error("Error loading posts:", error); }
    }

    async function editPost(postId) {
        try {
            const doc = await db.collection('posts').doc(postId).get();
            const post = doc.data();
            document.getElementById('post-id').value = doc.id;
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-category').value = post.category;
            document.getElementById('post-scripture').value = post.scripture || '';
            document.getElementById('post-image-url').value = post.image || '';
            document.getElementById('post-content').value = post.content || '';
            document.getElementById('editor-container').style.display = 'block';
        } catch (err) { console.error(err); }
    }

    async function deletePost(postId) {
        if (!confirm("Delete this post permanently?")) return;
        try {
            await db.collection('posts').doc(postId).delete();
            loadPosts();
        } catch (err) { console.error(err); }
    }

    // --- PRAYER REQUESTS & COMMENTS ---
    async function loadRequests() {
        if (!db || !requestsListContainer) return;
        requestsListContainer.innerHTML = '<h3>Loading requests...</h3>';
        try {
            const snapshot = await db.collection('requests').orderBy('date', 'desc').get();
            const requests = snapshot.docs.map(doc => {
                const data = doc.data();
                const dateString = data.date && data.date.toDate ? data.date.toDate().toLocaleString() : 'N/A';
                return { id: doc.id, ...data, date: dateString };
            });
            renderRequestsWithControls(requests);
        } catch (err) { console.error(err); }
    }

    function renderRequestsWithControls(requests) {
        if (!requestsListContainer) return;
        requestsListContainer.innerHTML = '<h3>Prayer Requests</h3>';
        if (requests.length === 0) {
            requestsListContainer.innerHTML += '<p>No requests found.</p>';
            return;
        }
        requests.forEach(req => {
            const div = document.createElement('div');
            div.className = 'request-item';
            div.innerHTML = `<p><strong>${req.firstName} ${req.lastName}</strong>: ${req.request}</p>
                             <button class="btn btn-primary btn-small delete-request-btn" data-id="${req.id}">Delete</button>`;
            requestsListContainer.appendChild(div);
        });
        document.querySelectorAll('.delete-request-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if(confirm("Delete request?")) {
                    await db.collection('requests').doc(btn.dataset.id).delete();
                    loadRequests();
                }
            });
        });
    }

    async function loadComments() {
        if (!db || !commentsListContainer) return;
        commentsListContainer.innerHTML = '<h3>Loading comments...</h3>';
        try {
            const snapshot = await db.collection('comments').orderBy('approved', 'asc').orderBy('date', 'desc').get();
            const comments = snapshot.docs.map(doc => {
                const data = doc.data();
                const dateString = data.date && data.date.toDate ? data.date.toDate().toLocaleString() : 'N/A';
                return { id: doc.id, ...data, date: dateString };
            });
            renderComments(comments);
        } catch (err) { console.error(err); }
    }

    function renderComments(comments) {
        if (!commentsListContainer) return;
        commentsListContainer.innerHTML = '<h3>Comments Management</h3>';
        if (comments.length === 0) {
            commentsListContainer.innerHTML += '<p>No comments found.</p>';
            return;
        }
        comments.forEach(comment => {
            const div = document.createElement('div');
            div.className = `comment-item ${comment.approved ? 'approved' : 'pending'}`;
            div.innerHTML = `<p><strong>${comment.name}</strong>: ${comment.comment}</p>
                             <button class="btn btn-secondary btn-small approve-btn" data-id="${comment.id}">${comment.approved ? 'Unapprove' : 'Approve'}</button>
                             <button class="btn btn-primary btn-small delete-comment-btn" data-id="${comment.id}">Delete</button>`;
            commentsListContainer.appendChild(div);
        });
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const isApproved = btn.textContent === 'Unapprove';
                await db.collection('comments').doc(btn.dataset.id).update({ approved: !isApproved });
                loadComments();
            });
        });
        document.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if(confirm("Delete comment?")) {
                    await db.collection('comments').doc(btn.dataset.id).delete();
                    loadComments();
                }
            });
        });
    }

    // Editor Logic
    if (document.getElementById('post-editor-form')) {
        document.getElementById('post-editor-form').addEventListener('submit', async e => {
            e.preventDefault();
            const savePostBtn = document.getElementById('save-post-btn');
            savePostBtn.disabled = true;
            try {
                const postId = document.getElementById('post-id').value;
                const postData = {
                    title: document.getElementById('post-title').value,
                    category: document.getElementById('post-category').value,
                    scripture: document.getElementById('post-scripture').value,
                    image: document.getElementById('post-image-url').value,
                    content: document.getElementById('post-content').value,
                    date: firebase.firestore.FieldValue.serverTimestamp(),
                };
                if (postId) await db.collection('posts').doc(postId).update(postData);
                else await db.collection('posts').add(postData);
                document.getElementById('editor-container').style.display = 'none';
                document.getElementById('post-editor-form').reset();
                loadPosts();
            } catch (err) { console.error(err); }
            finally { savePostBtn.disabled = false; }
        });
    }

    document.getElementById('new-post-btn')?.addEventListener('click', () => {
        document.getElementById('post-editor-form').reset();
        document.getElementById('post-id').value = '';
        document.getElementById('editor-container').style.display = 'block';
    });

    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
        document.getElementById('editor-container').style.display = 'none';
    });
});