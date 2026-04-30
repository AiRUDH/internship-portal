import {
  db, auth,
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  query, orderBy, serverTimestamp,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from './firebase.js';

const ADMIN_UID = "1ZvaGaS6tQbM64Tlaxtf6u8T5v02";

// ===== UTILS =====
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isValidUrl(u) { try { new URL(u); return true; } catch { return false; } }

// Hamburger
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

const page = window.location.pathname;

// ===== INDEX PAGE =====
if (page.includes('index.html') || page.endsWith('/internship-portal/') || page.endsWith('/internship-portal')) {
  let allInternships = [];

  async function loadInternships() {
    const grid = document.getElementById('internshipsGrid');
    const heroCount = document.getElementById('heroCount');
    if (!grid) return;

    try {
      const q = query(collection(db, 'internships'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);

      if (heroCount) heroCount.textContent = snap.size;

      if (snap.empty) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No internships posted yet. Check back soon!</p></div>';
        return;
      }

      allInternships = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderCards(allInternships);
    } catch (err) {
      console.error('Internships load error:', err);
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load internships. Please refresh the page.</p></div>';
      showToast('Failed to load internships.', 'error');
    }
  }

  function renderCards(list) {
    const grid = document.getElementById('internshipsGrid');
    if (!grid) return;
    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>No results found.</p></div>';
      return;
    }
    grid.innerHTML = list.map(item => `
      <div class="internship-card">
        <span class="card-badge">⏱ ${item.duration}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="card-footer">
          <a href="apply.html" class="btn btn-primary" style="padding:0.5rem 1.1rem;font-size:0.85rem;">Apply Now →</a>
        </div>
      </div>
    `).join('');
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase();
      renderCards(allInternships.filter(i =>
        i.title.toLowerCase().includes(term) || i.description.toLowerCase().includes(term)
      ));
    });
  }

  loadInternships();
}

// ===== APPLY PAGE =====
if (page.includes('apply.html')) {
  const form = document.getElementById('applyForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('appName').value.trim();
      const email = document.getElementById('appEmail').value.trim();
      const phone = document.getElementById('appPhone').value.trim();
      const resume = document.getElementById('appResume').value.trim();

      const nameErr = document.getElementById('nameError');
      const emailErr = document.getElementById('emailError');
      const phoneErr = document.getElementById('phoneError');
      const resumeErr = document.getElementById('resumeError');

      let valid = true;
      const show = (el, cond) => { el.classList.toggle('show', !cond); if (!cond) valid = false; };

      show(nameErr, name.length > 0);
      show(emailErr, isValidEmail(email));
      show(phoneErr, phone.length > 0);
      show(resumeErr, resume.length > 0 && (resume.startsWith('http://') || resume.startsWith('https://')));

      if (!valid) return;

      const btn = document.getElementById('applyBtn');
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      try {
        await addDoc(collection(db, 'applications'), {
          name, email, phone, resume,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        form.reset();
        document.getElementById('successMsg').classList.add('show');
        showToast('Application submitted!', 'success');
      } catch (err) {
        console.error('Application submission error:', err);
        showToast('Submission failed. Please check your connection and try again.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Application';
      }
    });
  }
}

// ===== LOGIN PAGE =====
if (page.includes('login.html')) {
  onAuthStateChanged(auth, (user) => {
    if (user && user.uid === ADMIN_UID) window.location.href = 'admin.html';
  });

  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const emailErr = document.getElementById('loginEmailError');
      const passErr = document.getElementById('loginPasswordError');
      const genErr = document.getElementById('loginGeneralError');

      let valid = true;
      if (!isValidEmail(email)) { emailErr.classList.add('show'); valid = false; } else { emailErr.classList.remove('show'); }
      if (!password) { passErr.classList.add('show'); valid = false; } else { passErr.classList.remove('show'); }
      if (!valid) return;

      genErr.classList.remove('show');
      const btn = document.getElementById('loginBtn');
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'admin.html';
      } catch (err) {
        console.error('Login error:', err);
        let errorMsg = 'Invalid email or password.';
        if (err.code === 'auth/network-request-failed') errorMsg = 'Network error. Please check your connection.';
        else if (err.code === 'auth/too-many-requests') errorMsg = 'Too many attempts. Please try again later.';
        genErr.textContent = errorMsg;
        genErr.classList.add('show');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }
}

// ===== ADMIN PAGE =====
if (page.includes('admin.html')) {
  let deleteTarget = null;
  let statusUpdateLock = new Set(); // Prevent rapid status updates

  // Auth guard with flicker prevention
  onAuthStateChanged(auth, (user) => {
    const authLoading = document.getElementById('authLoading');
    const adminLayout = document.getElementById('adminLayout');
    
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    
    if (user.uid !== ADMIN_UID) {
      if (authLoading) authLoading.innerHTML = '<div style="text-align:center;"><div style="font-size:3rem;margin-bottom:1rem;">🔒</div><h2 style="color:var(--danger);margin-bottom:0.5rem;">Access Denied</h2><p style="color:var(--text-light);margin-bottom:1.5rem;">You do not have permission to access this page.</p><a href="index.html" class="btn btn-primary">Go to Home</a></div>';
      setTimeout(() => window.location.href = 'index.html', 2500);
      return;
    }
    
    // Valid admin - show UI
    if (authLoading) authLoading.style.display = 'none';
    if (adminLayout) adminLayout.style.display = 'flex';
    
    const emailEl = document.getElementById('adminEmail');
    const avatarEl = document.getElementById('adminAvatar');
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = user.email.charAt(0).toUpperCase();
    
    loadStats();
    loadInternshipsTable();
    loadApplicationsTable();
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
  });

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
      const sec = document.getElementById(`section-${item.dataset.section}`);
      if (sec) sec.style.display = 'block';
      const titles = { internships: 'Manage Internships', applications: 'Applications' };
      const pt = document.getElementById('pageTitle');
      if (pt) pt.textContent = titles[item.dataset.section] || '';
    });
  });

  // Sidebar toggle (mobile)
  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebarToggle')?.addEventListener('click', () => sidebar?.classList.toggle('open'));

  // ===== STATS =====
  async function loadStats() {
    try {
      const [intSnap, appSnap] = await Promise.all([
        getDocs(query(collection(db, 'internships'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc')))
      ]);
      const ti = document.getElementById('totalInternships');
      const ta = document.getElementById('totalApplications');
      if (ti) ti.textContent = intSnap.size;
      if (ta) ta.textContent = appSnap.size;
    } catch (err) {
      console.error('Stats load error:', err);
      showToast('Failed to load statistics.', 'error');
    }
  }

  // ===== INTERNSHIPS TABLE =====
  async function loadInternshipsTable() {
    const tbody = document.getElementById('internshipsTable');
    if (!tbody) return;
    try {
      const q = query(collection(db, 'internships'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);

      if (snap.empty) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);">No internships yet. Click "+ Add Internship" to create one.</td></tr>';
        return;
      }

      tbody.innerHTML = snap.docs.map(d => {
        const data = d.data();
        return `
          <tr>
            <td style="font-weight:600;">${data.title}</td>
            <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${data.description}</td>
            <td>${data.duration}</td>
            <td>${formatDate(data.createdAt)}</td>
            <td>
              <button class="btn-icon del delete-int" data-id="${d.id}" title="Delete">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');

      document.querySelectorAll('.delete-int').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal('internship', btn.dataset.id));
      });
    } catch (err) {
      console.error('Internships table load error:', err);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--danger);">Failed to load internships. Please refresh the page.</td></tr>';
      showToast('Failed to load internships table.', 'error');
    }
  }

  // ===== APPLICATIONS TABLE =====
  function statusColor(s) {
    if (s === 'selected') return '#10B981';
    if (s === 'rejected') return '#EF4444';
    return '#F59E0B';
  }
  function statusBg(s) {
    if (s === 'selected') return 'rgba(16,185,129,0.08)';
    if (s === 'rejected') return 'rgba(239,68,68,0.08)';
    return 'rgba(245,158,11,0.08)';
  }

  async function loadApplicationsTable() {
    const tbody = document.getElementById('applicationsTable');
    if (!tbody) return;
    try {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);

      if (snap.empty) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-light);">No applications yet.</td></tr>';
        return;
      }

      tbody.innerHTML = snap.docs.map(d => {
        const data = d.data();
        const status = data.status || 'pending'; // Default to pending for data consistency
        return `
          <tr>
            <td>${data.name || '—'}</td>
            <td>${data.email || '—'}</td>
            <td>${data.phone || '—'}</td>
            <td><a href="${data.resume || '#'}" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600;">View →</a></td>
            <td>${formatDate(data.createdAt)}</td>
            <td>
              <select class="status-dropdown" data-id="${d.id}" data-old-status="${status}" style="
                padding:0.3rem 0.6rem; border-radius:6px; font-size:0.8rem; font-weight:600;
                border:1.5px solid; cursor:pointer; outline:none; transition:all 0.2s;
                background:${statusBg(status)}; color:${statusColor(status)}; border-color:${statusColor(status)};
              ">
                <option value="pending"  ${status === 'pending'  ? 'selected' : ''}>⏳ Pending</option>
                <option value="selected" ${status === 'selected' ? 'selected' : ''}>✅ Selected</option>
                <option value="rejected" ${status === 'rejected' ? 'selected' : ''}>❌ Rejected</option>
              </select>
            </td>
            <td>
              <button class="btn-icon del delete-app" data-id="${d.id}" title="Delete">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');

      document.querySelectorAll('.delete-app').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal('application', btn.dataset.id));
      });
    } catch (err) {
      console.error('Applications table load error:', err);
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--danger);">Failed to load applications. Please refresh the page.</td></tr>';
      showToast('Failed to load applications table.', 'error');
    }
  }

  // Status dropdown change — update Firestore with locking and error recovery
  document.addEventListener('change', async (e) => {
    if (!e.target.classList.contains('status-dropdown')) return;
    
    const dropdown = e.target;
    const id = dropdown.dataset.id;
    const newStatus = dropdown.value;
    const oldStatus = dropdown.dataset.oldStatus || newStatus;
    
    // Prevent concurrent updates on same item
    if (statusUpdateLock.has(id)) {
      showToast('Please wait for current update to complete.', 'error');
      dropdown.value = oldStatus;
      return;
    }
    
    statusUpdateLock.add(id);
    dropdown.disabled = true;
    dropdown.style.opacity = '0.6';
    dropdown.style.cursor = 'wait';
    
    // Update colors immediately for better UX
    dropdown.style.color = statusColor(newStatus);
    dropdown.style.borderColor = statusColor(newStatus);
    dropdown.style.background = statusBg(newStatus);
    
    try {
      await updateDoc(doc(db, 'applications', id), { status: newStatus });
      dropdown.dataset.oldStatus = newStatus; // Save for rollback
      showToast(`Status updated to "${newStatus}"`, 'success');
    } catch (err) {
      console.error('Status update error:', err);
      // Rollback on error
      dropdown.value = oldStatus;
      dropdown.style.color = statusColor(oldStatus);
      dropdown.style.borderColor = statusColor(oldStatus);
      dropdown.style.background = statusBg(oldStatus);
      showToast('Failed to update status. Please try again.', 'error');
    } finally {
      dropdown.disabled = false;
      dropdown.style.opacity = '1';
      dropdown.style.cursor = 'pointer';
      statusUpdateLock.delete(id);
    }
  });

  // ===== ADD INTERNSHIP MODAL =====
  const modal = document.getElementById('internshipModal');
  document.getElementById('addInternshipBtn')?.addEventListener('click', () => modal?.classList.add('open'));
  document.getElementById('modalClose')?.addEventListener('click', () => modal?.classList.remove('open'));
  document.getElementById('cancelModal')?.addEventListener('click', () => modal?.classList.remove('open'));

  document.getElementById('internshipForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('intTitle').value.trim();
    const description = document.getElementById('intDescription').value.trim();
    const duration = document.getElementById('intDuration').value.trim();

    const titleErr = document.getElementById('intTitleError');
    const descErr = document.getElementById('intDescError');
    const durErr = document.getElementById('intDurError');

    let valid = true;
    const show = (el, cond) => { el.classList.toggle('show', !cond); if (!cond) valid = false; };
    show(titleErr, title.length > 0);
    show(descErr, description.length > 0);
    show(durErr, duration.length > 0);
    if (!valid) return;

    const btn = document.getElementById('saveInternshipBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      await addDoc(collection(db, 'internships'), {
        title, description, duration,
        createdAt: serverTimestamp()
      });
      showToast('Internship added!', 'success');
      modal?.classList.remove('open');
      document.getElementById('internshipForm').reset();
      loadInternshipsTable();
      loadStats();
    } catch (err) {
      console.error('Add internship error:', err);
      showToast('Failed to add internship. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add Internship';
    }
  });

  // ===== DELETE MODAL =====
  const deleteModal = document.getElementById('deleteModal');
  document.getElementById('deleteModalClose')?.addEventListener('click', () => deleteModal?.classList.remove('open'));
  document.getElementById('cancelDelete')?.addEventListener('click', () => deleteModal?.classList.remove('open'));

  function openDeleteModal(type, id) {
    deleteTarget = { type, id };
    deleteModal?.classList.add('open');
  }

  document.getElementById('confirmDelete')?.addEventListener('click', async () => {
    if (!deleteTarget) return;
    const btn = document.getElementById('confirmDelete');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    try {
      const col = deleteTarget.type === 'internship' ? 'internships' : 'applications';
      await deleteDoc(doc(db, col, deleteTarget.id));
      showToast('Deleted successfully!', 'success');
      deleteModal?.classList.remove('open');
      if (deleteTarget.type === 'internship') loadInternshipsTable();
      else loadApplicationsTable();
      loadStats();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Delete failed. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
      deleteTarget = null;
    }
  });
}
