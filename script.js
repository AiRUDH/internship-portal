import { db, auth, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase.js';

// ===== UTILITY FUNCTIONS =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  hamburger.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') navLinks.classList.toggle('open');
  });
}

// ===== HOME PAGE =====
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
  
  // Load featured listings (limit 6)
  async function loadFeaturedListings() {
    const container = document.getElementById('featuredListings');
    if (!container) return;
    
    try {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No listings yet. Check back soon!</p></div>';
        return;
      }
      
      const listings = snapshot.docs.slice(0, 6);
      container.innerHTML = listings.map(doc => {
        const data = doc.data();
        return `
          <div class="listing-card">
            <span class="listing-category">${data.category || 'General'}</span>
            <h3>${data.title}</h3>
            <p>${data.description}</p>
            ${data.link ? `<a href="${data.link}" target="_blank" rel="noopener" class="btn btn-primary">Learn More →</a>` : ''}
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading featured listings:', error);
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load listings.</p></div>';
    }
  }
  
  // Load stats
  async function loadHomeStats() {
    try {
      const listingsSnap = await getDocs(collection(db, 'listings'));
      const appsSnap = await getDocs(collection(db, 'applications'));
      
      const statListings = document.getElementById('statListings');
      const statApps = document.getElementById('statApps');
      
      if (statListings) statListings.textContent = listingsSnap.size;
      if (statApps) statApps.textContent = appsSnap.size;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
  
  // Contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();
      
      const nameError = document.getElementById('nameError');
      const emailError = document.getElementById('emailError');
      const messageError = document.getElementById('messageError');
      
      let valid = true;
      
      if (!name) { nameError.classList.add('show'); valid = false; } else { nameError.classList.remove('show'); }
      if (!validateEmail(email)) { emailError.classList.add('show'); valid = false; } else { emailError.classList.remove('show'); }
      if (!message) { messageError.classList.add('show'); valid = false; } else { messageError.classList.remove('show'); }
      
      if (!valid) return;
      
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      
      try {
        await addDoc(collection(db, 'applications'), {
          name, email, message,
          createdAt: serverTimestamp()
        });
        showToast('Message sent successfully!', 'success');
        contactForm.reset();
      } catch (error) {
        console.error('Error submitting form:', error);
        showToast('Failed to send message. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }
  
  loadFeaturedListings();
  loadHomeStats();
}

// ===== LISTINGS PAGE =====
if (window.location.pathname.includes('listings.html')) {
  let allListings = [];
  
  async function loadAllListings() {
    const container = document.getElementById('listingsGrid');
    if (!container) return;
    
    try {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No listings available yet.</p></div>';
        return;
      }
      
      allListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderListings(allListings);
    } catch (error) {
      console.error('Error loading listings:', error);
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load listings.</p></div>';
    }
  }
  
  function renderListings(listings) {
    const container = document.getElementById('listingsGrid');
    if (!container) return;
    
    if (listings.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>No listings match your search.</p></div>';
      return;
    }
    
    container.innerHTML = listings.map(listing => `
      <div class="listing-card">
        <span class="listing-category">${listing.category || 'General'}</span>
        <h3>${listing.title}</h3>
        <p>${listing.description}</p>
        ${listing.link ? `<a href="${listing.link}" target="_blank" rel="noopener" class="btn btn-primary">Learn More →</a>` : ''}
      </div>
    `).join('');
  }
  
  // Search and filter
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  
  function filterListings() {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const category = categoryFilter?.value || '';
    
    const filtered = allListings.filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchTerm) || 
                           listing.description.toLowerCase().includes(searchTerm);
      const matchesCategory = !category || listing.category === category;
      return matchesSearch && matchesCategory;
    });
    
    renderListings(filtered);
  }
  
  if (searchInput) searchInput.addEventListener('input', filterListings);
  if (categoryFilter) categoryFilter.addEventListener('change', filterListings);
  
  loadAllListings();
}

// ===== LOGIN PAGE =====
if (window.location.pathname.includes('login.html')) {
  
  // Redirect if already logged in
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = 'admin.html';
  });
  
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      
      const emailError = document.getElementById('loginEmailError');
      const passwordError = document.getElementById('loginPasswordError');
      const generalError = document.getElementById('loginGeneralError');
      
      let valid = true;
      
      if (!validateEmail(email)) { emailError.classList.add('show'); valid = false; } else { emailError.classList.remove('show'); }
      if (!password) { passwordError.classList.add('show'); valid = false; } else { passwordError.classList.remove('show'); }
      
      if (!valid) return;
      
      generalError.classList.remove('show');
      const loginBtn = document.getElementById('loginBtn');
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';
      
      try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login successful!', 'success');
        setTimeout(() => window.location.href = 'admin.html', 500);
      } catch (error) {
        console.error('Login error:', error);
        generalError.textContent = 'Invalid email or password. Please try again.';
        generalError.classList.add('show');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
      }
    });
  }
}

// ===== ADMIN PAGE =====
if (window.location.pathname.includes('admin.html')) {
  
  let currentUser = null;
  let deleteTarget = null;
  
  const ADMIN_UID = "1ZvaGaS6tQbM64Tlaxtf6u8T5v02";

  // Auth check — only the specific admin UID is allowed
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'login.html';
    } else if (user.uid !== ADMIN_UID) {
      alert("Access Denied");
      window.location.href = 'index.html';
    } else {
      currentUser = user;
      const adminEmail = document.getElementById('adminEmail');
      const adminAvatar = document.getElementById('adminAvatar');
      if (adminEmail) adminEmail.textContent = user.email;
      if (adminAvatar) adminAvatar.textContent = user.email.charAt(0).toUpperCase();

      loadDashboard();
      loadListingsTable();
      loadApplicationsTable();
    }
  });
  
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        showToast('Logged out successfully', 'success');
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Logout error:', error);
        showToast('Failed to log out', 'error');
      }
    });
  }
  
  // Sidebar navigation
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.admin-section');
  const pageTitle = document.getElementById('pageTitle');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionName = item.dataset.section;
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      sections.forEach(s => s.style.display = 'none');
      const targetSection = document.getElementById(`section-${sectionName}`);
      if (targetSection) targetSection.style.display = 'block';
      
      const titles = { dashboard: 'Dashboard', listings: 'Manage Listings', applications: 'Applications', users: 'Users' };
      if (pageTitle) pageTitle.textContent = titles[sectionName] || 'Dashboard';
    });
  });
  
  // Sidebar toggle (mobile)
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebarClose');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  if (sidebarClose && sidebar) {
    sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));
  }
  
  // ===== DASHBOARD =====
  async function loadDashboard() {
    try {
      const listingsSnap = await getDocs(collection(db, 'listings'));
      const appsSnap = await getDocs(collection(db, 'applications'));
      
      const totalListings = document.getElementById('totalListings');
      const totalApplications = document.getElementById('totalApplications');
      const activeListings = document.getElementById('activeListings');
      const todayApps = document.getElementById('todayApps');
      
      if (totalListings) totalListings.textContent = listingsSnap.size;
      if (totalApplications) totalApplications.textContent = appsSnap.size;
      if (activeListings) activeListings.textContent = listingsSnap.size;
      
      // Today's apps
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = appsSnap.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt && createdAt >= today;
      }).length;
      if (todayApps) todayApps.textContent = todayCount;
      
      // Recent applications
      const recentApps = appsSnap.docs.slice(0, 5);
      const recentAppsTable = document.getElementById('recentAppsTable');
      if (recentAppsTable) {
        if (recentApps.length === 0) {
          recentAppsTable.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-light);">No applications yet.</td></tr>';
        } else {
          recentAppsTable.innerHTML = recentApps.map(doc => {
            const data = doc.data();
            return `
              <tr>
                <td>${data.name}</td>
                <td>${data.email}</td>
                <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${data.message}</td>
                <td>${formatDate(data.createdAt)}</td>
              </tr>
            `;
          }).join('');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }
  
  // ===== LISTINGS TABLE =====
  async function loadListingsTable() {
    const listingsTable = document.getElementById('listingsTable');
    if (!listingsTable) return;
    
    try {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        listingsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);">No listings yet. Click "Add Listing" to create one.</td></tr>';
        return;
      }
      
      listingsTable.innerHTML = snapshot.docs.map(doc => {
        const data = doc.data();
        return `
          <tr>
            <td style="font-weight:600;">${data.title}</td>
            <td><span class="badge badge-purple">${data.category || 'N/A'}</span></td>
            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${data.description}</td>
            <td>${formatDate(data.createdAt)}</td>
            <td>
              <button class="btn-icon edit-listing" data-id="${doc.id}" title="Edit">✏️</button>
              <button class="btn-icon delete delete-listing" data-id="${doc.id}" title="Delete">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');
      
      // Attach event listeners
      document.querySelectorAll('.edit-listing').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id, snapshot.docs));
      });
      document.querySelectorAll('.delete-listing').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal('listing', btn.dataset.id));
      });
    } catch (error) {
      console.error('Error loading listings table:', error);
      listingsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--secondary);">Failed to load listings.</td></tr>';
    }
  }
  
  // ===== APPLICATIONS TABLE =====
  async function loadApplicationsTable() {
    const applicationsTable = document.getElementById('applicationsTable');
    if (!applicationsTable) return;
    
    try {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        applicationsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);">No applications yet.</td></tr>';
        return;
      }
      
      applicationsTable.innerHTML = snapshot.docs.map(doc => {
        const data = doc.data();
        return `
          <tr>
            <td>${data.name}</td>
            <td>${data.email}</td>
            <td style="max-width:350px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${data.message}</td>
            <td>${formatDate(data.createdAt)}</td>
            <td>
              <button class="btn-icon delete delete-application" data-id="${doc.id}" title="Delete">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');
      
      document.querySelectorAll('.delete-application').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal('application', btn.dataset.id));
      });
    } catch (error) {
      console.error('Error loading applications table:', error);
      applicationsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--secondary);">Failed to load applications.</td></tr>';
    }
  }
  
  // ===== ADD / EDIT LISTING MODAL =====
  const listingModal = document.getElementById('listingModal');
  const addListingBtn = document.getElementById('addListingBtn');
  const modalClose = document.getElementById('modalClose');
  const cancelModal = document.getElementById('cancelModal');
  const listingForm = document.getElementById('listingForm');
  const modalTitle = document.getElementById('modalTitle');
  
  if (addListingBtn) {
    addListingBtn.addEventListener('click', () => {
      listingForm.reset();
      document.getElementById('editListingId').value = '';
      modalTitle.textContent = 'Add New Listing';
      listingModal.classList.add('open');
    });
  }
  
  if (modalClose) modalClose.addEventListener('click', () => listingModal.classList.remove('open'));
  if (cancelModal) cancelModal.addEventListener('click', () => listingModal.classList.remove('open'));
  
  function openEditModal(id, docs) {
    const docData = docs.find(d => d.id === id);
    if (!docData) return;
    
    const data = docData.data();
    document.getElementById('editListingId').value = id;
    document.getElementById('listingTitle').value = data.title || '';
    document.getElementById('listingCategory').value = data.category || '';
    document.getElementById('listingDescription').value = data.description || '';
    document.getElementById('listingLink').value = data.link || '';
    
    modalTitle.textContent = 'Edit Listing';
    listingModal.classList.add('open');
  }
  
  if (listingForm) {
    listingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('listingTitle').value.trim();
      const category = document.getElementById('listingCategory').value;
      const description = document.getElementById('listingDescription').value.trim();
      const link = document.getElementById('listingLink').value.trim();
      const editId = document.getElementById('editListingId').value;
      
      const titleError = document.getElementById('titleError');
      const categoryError = document.getElementById('categoryError');
      const descError = document.getElementById('descError');
      
      let valid = true;
      
      if (!title) { titleError.classList.add('show'); valid = false; } else { titleError.classList.remove('show'); }
      if (!category) { categoryError.classList.add('show'); valid = false; } else { categoryError.classList.remove('show'); }
      if (!description) { descError.classList.add('show'); valid = false; } else { descError.classList.remove('show'); }
      
      if (!valid) return;
      
      const saveBtn = document.getElementById('saveListingBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      
      try {
        const listingData = { title, category, description, link };
        
        if (editId) {
          await updateDoc(doc(db, 'listings', editId), listingData);
          showToast('Listing updated successfully!', 'success');
        } else {
          await addDoc(collection(db, 'listings'), { ...listingData, createdAt: serverTimestamp() });
          showToast('Listing added successfully!', 'success');
        }
        
        listingModal.classList.remove('open');
        loadListingsTable();
        loadDashboard();
      } catch (error) {
        console.error('Error saving listing:', error);
        showToast('Failed to save listing. Please try again.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Listing';
      }
    });
  }
  
  // ===== DELETE MODAL =====
  const deleteModal = document.getElementById('deleteModal');
  const deleteModalClose = document.getElementById('deleteModalClose');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');
  
  if (deleteModalClose) deleteModalClose.addEventListener('click', () => deleteModal.classList.remove('open'));
  if (cancelDelete) cancelDelete.addEventListener('click', () => deleteModal.classList.remove('open'));
  
  function openDeleteModal(type, id) {
    deleteTarget = { type, id };
    deleteModal.classList.add('open');
  }
  
  if (confirmDelete) {
    confirmDelete.addEventListener('click', async () => {
      if (!deleteTarget) return;
      
      confirmDelete.disabled = true;
      confirmDelete.textContent = 'Deleting...';
      
      try {
        const collectionName = deleteTarget.type === 'listing' ? 'listings' : 'applications';
        await deleteDoc(doc(db, collectionName, deleteTarget.id));
        showToast(`${deleteTarget.type === 'listing' ? 'Listing' : 'Application'} deleted successfully!`, 'success');
        
        deleteModal.classList.remove('open');
        
        if (deleteTarget.type === 'listing') {
          loadListingsTable();
        } else {
          loadApplicationsTable();
        }
        loadDashboard();
      } catch (error) {
        console.error('Error deleting:', error);
        showToast('Failed to delete. Please try again.', 'error');
      } finally {
        confirmDelete.disabled = false;
        confirmDelete.textContent = 'Delete';
        deleteTarget = null;
      }
    });
  }
}
