lucide.createIcons();

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        loadStats();
        loadAdminProjects();
        loadAdminReviews();
    } else {
        loginScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    const btn = document.getElementById('loginBtn');
    btn.innerText = 'جاري التحقق...';

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('adminToken', data.token); 
            loginError.classList.add('hidden');
            checkAuth(); 
        } else {
            loginError.classList.remove('hidden');
            document.getElementById('adminPassword').value = '';
        }
    } catch (error) {
        alert("خطأ في الاتصال بالسيرفر");
    } finally {
        btn.innerText = 'تسجيل الدخول';
    }
});

window.logout = function() {
    localStorage.removeItem('adminToken'); 
    checkAuth(); 
}


function getAuthHeaders(isFormData = false) {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    };
    
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}

async function loadStats() {
    try {
        const res = await fetch('/api/admin/stats', { headers: getAuthHeaders() });
        const data = await res.json();
        
        let currentVal = 0;
        const targetVal = data.visits;
        const counterEl = document.getElementById('total-visits');
        
        if (targetVal === 0) return;
        
        const interval = setInterval(() => {
            if(currentVal >= targetVal) {
                clearInterval(interval);
                counterEl.innerText = targetVal;
            } else {
                currentVal += Math.ceil(targetVal / 20);
                if(currentVal > targetVal) currentVal = targetVal;
                counterEl.innerText = currentVal;
            }
        }, 30);
    } catch (error) { console.error("Error", error); }
}

async function loadAdminProjects() {
    try {
        const res = await fetch('/api/admin/projects', { headers: getAuthHeaders() });
        if(res.status === 401) return logout(); 
        
        const projects = await res.json();
        const container = document.getElementById('admin-projects');
        
        container.innerHTML = projects.map(p => `
            <div class="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex justify-between items-center hover:bg-slate-800 transition-colors">
                <div class="flex items-center gap-4">
                    ${p.imageUrl ? `<img src="${p.imageUrl}" class="w-16 h-12 object-cover rounded-lg border border-slate-600">` : `<div class="w-16 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500"><i data-lucide="image" class="w-5 h-5"></i></div>`}
                    <div>
                        <h4 class="font-bold text-lg text-white">${p.title}</h4>
                        <span class="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md mt-1 inline-block">${p.category}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="toggleHome('projects', '${p._id}')" class="p-2.5 rounded-xl ${p.showOnHome ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-700 text-slate-400'} hover:opacity-80 transition-all" title="تثبيت في الرئيسية">
                        <i data-lucide="pin" class="w-5 h-5"></i>
                    </button>
                    <button onclick="deleteItem('projects', '${p._id}')" class="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (error) { console.error("Error", error); }
}

async function loadAdminReviews() {
    try {
        const res = await fetch('/api/admin/reviews', { headers: getAuthHeaders() });
        if(res.status === 401) return logout();

        const reviews = await res.json();
        const container = document.getElementById('admin-reviews');
        
        container.innerHTML = reviews.map(r => `
            <div class="bg-slate-800/50 border p-5 rounded-2xl transition-colors ${r.isApproved ? 'border-emerald-500/30' : 'border-red-500/30 opacity-75'}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-bold text-lg text-white">${r.reviewerName}</h4>
                        <div class="flex text-amber-400 mt-1">
                            ${Array(r.rating).fill('<i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>').join('')}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="toggleApprove('${r._id}')" class="p-2 rounded-xl ${r.isApproved ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-700 text-slate-400'} hover:opacity-80 transition-all" title="${r.isApproved ? 'إخفاء' : 'موافقة وعرض'}">
                            <i data-lucide="${r.isApproved ? 'check-circle' : 'eye-off'}" class="w-4 h-4"></i>
                        </button>
                        <button onclick="toggleHome('reviews', '${r._id}')" class="p-2 rounded-xl ${r.showOnHome ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-700 text-slate-400'} hover:opacity-80 transition-all" title="تثبيت في الرئيسية">
                            <i data-lucide="pin" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteItem('reviews', '${r._id}')" class="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <p class="text-slate-400 text-sm italic leading-relaxed">"${r.message}"</p>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (error) { console.error("Error", error); }
}


document.getElementById('p-image').addEventListener('change', function(e) {
    const fileNameDisplay = document.getElementById('file-name-display');
    if (e.target.files.length > 0) {
        fileNameDisplay.innerText = "تم اختيار: " + e.target.files[0].name;
        fileNameDisplay.classList.add('text-emerald-400');
    } else {
        fileNameDisplay.innerText = "اضغط هنا لاختيار صورة للمشروع";
        fileNameDisplay.classList.remove('text-emerald-400');
    }
});


document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btn-add-project');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'جاري الرفع... <i data-lucide="loader-2" class="w-5 h-5 inline animate-spin"></i>';
    btn.disabled = true;
    lucide.createIcons();

    const formData = new FormData();
    formData.append('title', document.getElementById('p-title').value);
    formData.append('description', document.getElementById('p-descAr').value);
    formData.append('descriptionEn', document.getElementById('p-descEn').value);
    formData.append('link', document.getElementById('p-link').value);
    formData.append('category', document.getElementById('p-cat').value);
    
    const imageFile = document.getElementById('p-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const res = await fetch('/api/admin/projects', { 
            method: 'POST', 
            headers: getAuthHeaders(true), 
            body: formData 
        });

        if (res.ok) {
            e.target.reset();
            document.getElementById('file-name-display').innerText = "اضغط هنا لاختيار صورة للمشروع";
            document.getElementById('file-name-display').classList.remove('text-emerald-400');
            loadAdminProjects();
        } else {
            alert('حدث خطأ أثناء الرفع');
        }
    } catch (err) {
        alert('فشل الاتصال بالسيرفر');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});


document.getElementById('profile-image-upload').addEventListener('change', function(e) {
    const label = document.querySelector('label[for="profile-image-upload"]');
    if (e.target.files.length > 0) {
        label.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> تم الاختيار: ${e.target.files[0].name.substring(0, 15)}...`;
    } else {
        label.innerHTML = `<i data-lucide="upload-cloud" class="w-4 h-4"></i> اختر صورة جديدة`;
    }
    lucide.createIcons();
});


document.getElementById('profilePicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('profile-image-upload');
    if (fileInput.files.length === 0) return alert('برجاء اختيار صورة أولاً');
    
    const btn = document.getElementById('btn-update-profile');
    btn.innerText = 'جاري التحديث...';
    btn.disabled = true;

    
    setTimeout(() => {
        alert('واجهة التحديث جاهزة! سنقوم ببرمجة الباك إند الخاص بها في الخطوة القادمة 🚀');
        btn.innerText = 'تحديث';
        btn.disabled = false;
        fileInput.value = '';
        document.querySelector('label[for="profile-image-upload"]').innerHTML = `<i data-lucide="upload-cloud" class="w-4 h-4"></i> اختر صورة جديدة`;
        lucide.createIcons();
    }, 1000);
});

window.deleteItem = async function(type, id) {
    if(confirm('هل أنت متأكد من الحذف النهائي؟ 🗑️')) {
        await fetch(`/api/admin/${type}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        type === 'projects' ? loadAdminProjects() : loadAdminReviews();
    }
}
window.toggleHome = async function(type, id) {
    await fetch(`/api/admin/${type}/${id}/home`, { method: 'PUT', headers: getAuthHeaders() });
    type === 'projects' ? loadAdminProjects() : loadAdminReviews();
}
window.toggleApprove = async function(id) {
    await fetch(`/api/admin/reviews/${id}/approve`, { method: 'PUT', headers: getAuthHeaders() });
    loadAdminReviews();
}

checkAuth();