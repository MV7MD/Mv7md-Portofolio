lucide.createIcons();

// --- 🔒 نظام تسجيل الدخول ---
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

// التحقق هل إنت مسجل دخول قبل كده ولا لأ
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        // تحميل الداتا فقط لو إنت مسجل دخول
        loadStats();
        loadAdminProjects();
        loadAdminReviews();
    } else {
        loginScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }
}

// إرسال الباسورد للسيرفر
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
            localStorage.setItem('adminToken', data.token); // حفظ المفتاح
            loginError.classList.add('hidden');
            checkAuth(); // فتح اللوحة
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

// تسجيل الخروج
window.logout = function() {
    localStorage.removeItem('adminToken'); // مسح المفتاح
    checkAuth(); // رجوع لشاشة اللوجين
}

// دالة مساعدة عشان تبعت الـ Token مع كل طلب
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    };
}

// ==========================================
// 🌟 دوال جلب وعرض البيانات (المحمية) 🌟
// ==========================================

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
        // لاحظ إضافة الـ Headers هنا
        const res = await fetch('/api/admin/projects', { headers: getAuthHeaders() });
        
        if(res.status === 401) return logout(); // لو المفتاح غلط اطرده
        
        const projects = await res.json();
        const container = document.getElementById('admin-projects');
        
        container.innerHTML = projects.map(p => `
            <div class="glass-panel flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-lg">${p.title}</h4>
                    <span class="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">${p.category}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="toggleHome('projects', '${p._id}')" class="p-2 rounded-lg ${p.showOnHome ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400'} hover:opacity-80 transition-all" title="تثبيت في الرئيسية">
                        <i data-lucide="pin" class="w-5 h-5"></i>
                    </button>
                    <button onclick="deleteItem('projects', '${p._id}')" class="p-2 rounded-lg bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all">
                        <i data-lucide="trash" class="w-5 h-5"></i>
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
            <div class="glass-panel ${r.isApproved ? 'border-emerald-500/30' : 'border-red-500/30 opacity-75'}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-bold text-lg">${r.reviewerName}</h4>
                        <div class="flex text-yellow-400 mt-1">
                            ${Array(r.rating).fill('<i data-lucide="star" class="w-3 h-3 fill-current"></i>').join('')}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="toggleApprove('${r._id}')" class="p-2 rounded-lg ${r.isApproved ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'} hover:opacity-80 transition-all">
                            <i data-lucide="${r.isApproved ? 'check-circle' : 'eye-off'}" class="w-5 h-5"></i>
                        </button>
                        <button onclick="toggleHome('reviews', '${r._id}')" class="p-2 rounded-lg ${r.showOnHome ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400'} hover:opacity-80 transition-all">
                            <i data-lucide="pin" class="w-5 h-5"></i>
                        </button>
                        <button onclick="deleteItem('reviews', '${r._id}')" class="p-2 rounded-lg bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all">
                            <i data-lucide="trash" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                <p class="text-slate-300 text-sm italic">"${r.message}"</p>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (error) { console.error("Error", error); }
}

document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById('p-title').value,
        description: document.getElementById('p-descAr').value,
        descriptionEn: document.getElementById('p-descEn').value,
        link: document.getElementById('p-link').value,
        category: document.getElementById('p-cat').value
    };
    await fetch('/api/admin/projects', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    e.target.reset();
    loadAdminProjects();
});

window.deleteItem = async function(type, id) {
    if(confirm('هل أنت متأكد من الحذف؟')) {
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

// البداية
checkAuth();