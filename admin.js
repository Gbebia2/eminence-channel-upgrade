// ===============================
// ADMIN DASHBOARD - SECURE & COMPLETE VERSION
// ===============================

document.addEventListener('DOMContentLoaded', async () => {

    // ---------------------------
    // 1. WAIT FOR FIREBASE DB (FIRESTORE ONLY)
    // ---------------------------
    async function waitForDb(timeout = 5000) {
        const interval = 250;
        let waited = 0;
        while (!window.db && waited < timeout) {
            await new Promise(resolve => setTimeout(resolve, interval));
            waited += interval;
        }
        if (!window.db) {
            console.error("Database connection (db) is not initialized. Admin functions disabled.");
        }
        return window.db;
    }

    const db = await waitForDb();

    // ---------------------------
    // 2. FIREBASE AUTHENTICATION (SECURE)
    // ---------------------------
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    const postsListContainer = document.getElementById('posts-list');
    const requestsListContainer = document.getElementById('requests-list');
    const commentsListContainer = document.getElementById('comments-list-admin'); // NEW COMMENT CONTAINER

    const showDashboard = () => {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadPosts();
        loadRequests();
        loadComments(); // NEW: Load comments upon successful login
    };

    const showLogin = (errorMessage = null) => {
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'block';
        if (errorMessage) {
            loginError.textContent = errorMessage;
            loginError.style.display = 'block';
        } else {
            loginError.style.display = 'none';
        }
    };

    // --- Firebase Auth Handlers ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('admin-email').value;
            const passwordInput = document.getElementById('admin-password').value;

            showLogin('Logging in...');

            try {
                await firebase.auth().signInWithEmailAndPassword(emailInput, passwordInput);
            } catch (error) {
                console.error("Login failed:", error);
                showLogin(`Login failed: ${error.message.substring(0, 50)}...`);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await firebase.auth().signOut();
        });
    }

    // Global Auth State Listener: This is the secure gate
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            showDashboard();
        } else {
            showLogin('Please sign in to access the dashboard.');
        }
    });

    // ---------------------------
    // 3. POSTS MANAGEMENT
    // ---------------------------
    const editorContainer = document.getElementById('editor-container');
    const postEditorForm = document.getElementById('post-editor-form');
    const postIdHidden = document.getElementById('post-id');
    const postTitleInput = document.getElementById('post-title');
    const postCategorySelect = document.getElementById('post-category');
    const postScriptureInput = document.getElementById('post-scripture');
    const postImageUrlInput = document.getElementById('post-image-url');
    const postContentTextarea = document.getElementById('post-content');

    function renderPosts(posts) {
        postsListContainer.innerHTML = '<h3>Existing Posts</h3>';
        if (posts.length === 0) {
            postsListContainer.innerHTML += '<p>No posts found.</p>';
            return;
        }
        posts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'post-item';
            item.innerHTML = `
                <span>[${post.category.toUpperCase()}] ${post.title} (${post.date})</span>
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
        if (!db) return;
        postsListContainer.innerHTML = '<h3>Loading posts...</h3>';
        try {
            const snapshot = await db.collection('posts').orderBy('date', 'desc').get();
            const posts = snapshot.docs.map(doc => {
                const data = doc.data();
                const dateString = data.date && data.date.toDate ? data.date.toDate().toLocaleDateString() : 'N/A';
                return { id: doc.id, ...data, date: dateString };
            });
            renderPosts(posts);
        } catch (error) {
            console.error("Error loading posts:", error);
            postsListContainer.innerHTML = '<p>Error loading posts. Check console.</p>';
        }
    }

    async function editPost(postId) {
        if (!db) return alert("Firebase not connected.");
        try {
            const doc = await db.collection('posts').doc(postId).get();
            if (!doc.exists) return alert("Post not found.");
            const post = doc.data();

            postIdHidden.value = doc.id;
            postTitleInput.value = post.title;
            postCategorySelect.value = post.category;
            postScriptureInput.value = post.scripture || '';
            postImageUrlInput.value = post.image || '';
            postContentTextarea.value = post.content || '';

            editorContainer.style.display = 'block';
        } catch (err) {
            console.error(err);
            alert("Error loading post for editing.");
        }
    }

    async function deletePost(postId) {
        if (!db) return alert("Firebase not connected.");
        if (!confirm("Delete this post permanently?")) return;
        try {
            await db.collection('posts').doc(postId).delete();
            loadPosts();
        } catch (err) {
            console.error(err);
            alert("Error deleting post.");
        }
    }

    if (postEditorForm) {
        postEditorForm.addEventListener('submit', async e => {
            e.preventDefault();
            if (!db) return alert("Firebase not connected.");

            const savePostBtn = document.getElementById('save-post-btn');
            const originalButtonText = savePostBtn.textContent;
            savePostBtn.textContent = 'Saving...';
            savePostBtn.disabled = true;

            try {
                const postId = postIdHidden.value;
                const imageUrl = postImageUrlInput.value;

                const postData = {
                    title: postTitleInput.value,
                    category: postCategorySelect.value,
                    scripture: postScriptureInput.value,
                    image: imageUrl,
                    content: postContentTextarea.value,
                    date: firebase.firestore.FieldValue.serverTimestamp(),
                };

                if (postId) {
                    await db.collection('posts').doc(postId).update(postData);
                    alert("Post updated!");
                } else {
                    await db.collection('posts').add(postData);
                    alert("New post created!");
                }

                editorContainer.style.display = 'none';
                postEditorForm.reset();
                loadPosts();

            } catch (err) {
                console.error(err);
                alert(`Error saving post: ${err.message || 'Check console.'}`);
            } finally {
                savePostBtn.textContent = originalButtonText;
                savePostBtn.disabled = false;
            }
        });
    }

    document.getElementById('new-post-btn')?.addEventListener('click', () => {
        postEditorForm.reset();
        postIdHidden.value = '';
        editorContainer.style.display = 'block';
        postImageUrlInput.value = '';
    });

    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
        editorContainer.style.display = 'none';
    });

    // ---------------------------
    // 4. PRAYER REQUESTS (Delete-only, Latest Tag, Collapse/Expand)
    // ---------------------------
    const REQUESTS_PER_PAGE = 1;
    let allRequests = [];

    async function deleteRequest(requestId) {
        if (!db) return alert("Firebase not connected.");
        if (!confirm("Are you sure you want to permanently delete this prayer request?")) return;
        try {
            await db.collection('requests').doc(requestId).delete();
            alert("Request deleted!");
            loadRequests();
        } catch (err) {
            console.error(err);
            alert("Error deleting request.");
        }
    }

    function renderRequestsWithControls(requestsToRender = allRequests, showAll = false) {
        if (!requestsListContainer) return;

        requestsListContainer.innerHTML = '<h3>Prayer Requests</h3>';

        if (requestsToRender.length === 0) {
            requestsListContainer.innerHTML += '<p>No requests found.</p>';
            return;
        }

        const requestsContainer = document.createElement('div');
        requestsContainer.className = 'requests-scroll-container';

        const listToRender = showAll ? requestsToRender : requestsToRender.slice(0, REQUESTS_PER_PAGE);

        listToRender.forEach((req, index) => {
            const isLatest = index === 0;
            const div = document.createElement('div');
            div.className = 'request-item';

            const latestTag = isLatest
                ? `<span style="font-weight:900; color:white; background-color: var(--color-cta-blue-dark); padding: 3px 8px; border-radius: 4px; margin-left: 10px;">!! LATEST !!</span>`
                : '';

            div.innerHTML = `
                <p><strong>${req.firstName} ${req.lastName}</strong> (${req.email} | ${req.phone || 'No phone'})</p>
                <p><strong>Contact Pref:</strong> ${req.contactPreference}${latestTag}</p>
                <p><strong>Date:</strong> ${req.date}</p>
                <div class="request-content-box" style="margin-top: 10px; padding: 10px; border: 1px dashed #ccc; border-radius: 4px;">
                    <p><strong>Request:</strong> ${req.request}</p>
                </div>
                <div class="post-item-actions" style="margin-top: 10px;">
                    <button class="btn btn-primary btn-small delete-request-btn" data-id="${req.id}">Delete</button>
                </div>
            `;
            requestsContainer.appendChild(div);
        });

        requestsListContainer.appendChild(requestsContainer);

        // --- Show/Hide All Controls ---
        if (allRequests.length > REQUESTS_PER_PAGE && !showAll) {
            const showAllBtn = document.createElement('button');
            showAllBtn.className = 'btn btn-secondary show-all-btn';
            showAllBtn.textContent = `Show All ${allRequests.length} Requests...`;
            showAllBtn.style.marginTop = '15px';
            showAllBtn.addEventListener('click', () => renderRequestsWithControls(allRequests, true));
            requestsListContainer.appendChild(showAllBtn);
        } else if (allRequests.length > REQUESTS_PER_PAGE && showAll) {
            const hideBtn = document.createElement('button');
            hideBtn.className = 'btn btn-secondary hide-btn';
            hideBtn.textContent = `Show Only Latest Request`;
            hideBtn.style.marginTop = '15px';
            hideBtn.addEventListener('click', () => renderRequestsWithControls(allRequests, false));
            requestsListContainer.appendChild(hideBtn);
        }

        // Attach Delete Listener
        document.querySelectorAll('.delete-request-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteRequest(e.currentTarget.dataset.id));
        });
    }

    async function loadRequests() {
        if (!db || !requestsListContainer) return;
        requestsListContainer.innerHTML = '<h3>Loading requests...</h3>';
        try {
            const snapshot = await db.collection('requests').orderBy('date', 'desc').get();

            allRequests = snapshot.docs.map(doc => {
                const data = doc.data();
                const dateString = data.date && data.date.toDate ? data.date.toDate().toLocaleString() : 'N/A';
                return { id: doc.id, ...data, date: dateString };
            });

            renderRequestsWithControls(allRequests);

        } catch (err) {
            console.error("Error loading requests:", err);
            requestsListContainer.innerHTML = '<p>Error loading requests. Check console.</p>';
        }
    }


    // ---------------------------
    // 5. COMMENT MANAGEMENT (NEW)
    // ---------------------------
    async function deleteComment(commentId) {
        if (!db) return alert("Firebase not connected.");
        if (!confirm("Are you sure you want to permanently delete this comment?")) return;
        try {
            await db.collection('comments').doc(commentId).delete();
            alert("Comment deleted!");
            loadComments(); // Reload the list
        } catch (err) {
            console.error("Error deleting comment:", err);
            alert("Error deleting comment. Check console.");
        }
    }

    async function approveComment(commentId, approve = true) {
        if (!db) return alert("Firebase not connected.");

        const confirmation = approve ? "Approve this comment?" : "Unapprove this comment?";

        if (!confirm(confirmation)) return;

        try {
            await db.collection('comments').doc(commentId).update({
                approved: approve
            });
            alert(`Comment status updated to ${approve ? 'Approved' : 'Pending'}!`);
            loadComments(); // Reload the list
        } catch (err) {
            console.error("Error updating comment status:", err);
            alert("Error updating comment status. Check console.");
        }
    }

    function renderComments(comments) {
        if (!commentsListContainer) return;

        commentsListContainer.innerHTML = '<h3>Pending Comments</h3>';

        // Check for *pending* comments to show in the list initially
        const pendingComments = comments.filter(c => c.approved === false);

        if (comments.length === 0) {
            commentsListContainer.innerHTML = '<p>No comments found in the database.</p>';
            return;
        }

        if (pendingComments.length === 0) {
             commentsListContainer.innerHTML = '<p>No comments awaiting approval.</p>';
        }

        const commentListDiv = document.createElement('div');
        commentListDiv.className = 'comments-scroll-container';

        comments.forEach(comment => {
            const div = document.createElement('div');
            // Show all comments, but style them differently
            div.className = `comment-item ${comment.approved ? 'approved' : 'pending'}`;

            const statusBadge = comment.approved
                ? '<span style="color: green; font-weight: bold;">[APPROVED]</span>'
                : '<span style="color: red; font-weight: bold;">[PENDING]</span>';

            const actionButton = comment.approved
                ? `<button class="btn btn-secondary btn-small unapprove-btn" data-id="${comment.id}">Unapprove</button>`
                : `<button class="btn btn-primary btn-small approve-btn" data-id="${comment.id}">Approve</button>`;

            div.innerHTML = `
                <p><strong>From:</strong> ${comment.name} ${statusBadge}</p>
                <p><strong>Post ID:</strong> ${comment.postId}</p>
                <p><strong>Date:</strong> ${comment.date}</p>
                <div class="comment-content-box" style="margin-top: 10px; padding: 10px; border: 1px dashed #ccc; border-radius: 4px;">
                    <p>${comment.comment}</p>
                </div>
                <div class="post-item-actions" style="margin-top: 10px;">
                    ${actionButton}
                    <button class="btn btn-primary btn-small delete-comment-btn" data-id="${comment.id}">Delete</button>
                </div>
            `;
            commentListDiv.appendChild(div);
        });

        commentsListContainer.appendChild(commentListDiv);

        // Attach Action Listeners
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => approveComment(btn.dataset.id, true));
        });
        document.querySelectorAll('.unapprove-btn').forEach(btn => {
            btn.addEventListener('click', () => approveComment(btn.dataset.id, false));
        });
        document.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteComment(btn.dataset.id));
        });
    }

    async function loadComments() {
        if (!db || !commentsListContainer) return;
        commentsListContainer.innerHTML = '<h3>Loading comments...</h3>';
        try {
            // Fetch all comments, sorted by approval status (pending first) and then by date
            const snapshot = await db.collection('comments')
                .orderBy('approved', 'asc') // PENDING (false) loads before APPROVED (true)
                .orderBy('date', 'desc')
                .get();

            const comments = snapshot.docs.map(doc => {
                const data = doc.data();
                const dateString = data.date && data.date.toDate ? data.date.toDate().toLocaleString() : 'N/A';
                return { id: doc.id, ...data, date: dateString };
            });

            renderComments(comments);

        } catch (err) {
            console.error("Error loading comments:", err);
            commentsListContainer.innerHTML = '<p>Error loading comments. Check console.</p>';
        }
    }

});