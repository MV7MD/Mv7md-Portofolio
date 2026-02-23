lucide.createIcons();

// --- 1. إدارة الحالة (الثيم واللغة) ---
const savedLang = localStorage.getItem('lang') || 'ar';
if (savedLang === 'en') {
    applyLanguage('en');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
});

// --- 2. قائمة الموبايل المنسدلة ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

function toggleMobileMenu() {
    const isOpen = mobileMenu.classList.toggle('open');
    const menuIcon = document.getElementById('menu-icon');
    
    if (isOpen) {
        mobileMenuBtn.innerHTML = '<i data-lucide="x" class="w-5 h-5 transition-transform duration-300"></i>';
    } else {
        mobileMenuBtn.innerHTML = '<i data-lucide="menu" class="w-5 h-5 transition-transform duration-300"></i>';
    }
    
    lucide.createIcons(); 
    document.body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen) {
        mobileLinks.forEach((link, index) => {
            link.style.transitionDelay = `${(index + 1) * 0.1}s`;
        });
    } else {
        mobileLinks.forEach(link => link.style.transitionDelay = '0s');
    }
}

mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
});

document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && e.target !== mobileMenuBtn) {
        toggleMobileMenu();
    }
});

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        if(mobileMenu.classList.contains('open')) toggleMobileMenu();
    });
});

// --- 3. جلب وعرض المشاريع (المثبتة في الهوم فقط) ---
async function fetchProjects() {
    const container = document.getElementById('projects-container');
    const isAr = document.documentElement.dir === 'rtl';

    try {
        const res = await fetch('/api/projects/home');
        const dbProjects = await res.json();

        if (dbProjects.length === 0) {
            container.innerHTML = `<p class="col-span-full text-center opacity-50">${isAr ? 'لا توجد مشاريع مثبتة حالياً.' : 'No pinned projects.'}</p>`;
            return;
        }

        container.innerHTML = dbProjects.map(p => `
            <div class="glass-card p-10 group hover:-translate-y-3 transition-all duration-500 hover:shadow-blue-500/10 flex flex-col h-full">
                <div class="flex justify-between items-center mb-8">
                    <div class="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                        <i data-lucide="layout-template"></i>
                    </div>
                    <span class="text-[10px] font-black tracking-widest text-blue-500 uppercase">${p.category || 'Web'}</span>
                </div>
                <h3 class="text-2xl font-black mb-4 group-hover:text-blue-500 transition-colors">${p.title}</h3>
                <p class="text-slate-500 dark:text-slate-400 mb-8 flex-grow">${isAr ? (p.description || p.descriptionEn) : (p.descriptionEn || p.description)}</p>
                <a href="${p.link || '#'}" target="_blank" class="inline-flex items-center gap-2 font-black text-sm text-blue-600 group-hover:gap-4 transition-all uppercase w-fit">
                    ${isAr ? 'عرض المشروع' : 'Open Project'} <i data-lucide="external-link" class="w-4 h-4"></i>
                </a>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (e) { console.log("خطأ في الاتصال"); }
}

// --- 4. جلب وعرض التقييمات (المثبتة في الهوم فقط) ---
async function fetchRecentReviews() {
    const container = document.getElementById('reviews-container');
    const isAr = document.documentElement.dir === 'rtl';
    
    try {
        const res = await fetch('/api/reviews/home');
        if (!res.ok) throw new Error('Error');
        const reviews = await res.json();
        
        if (reviews.length === 0) {
            container.innerHTML = `<p class="col-span-full text-center opacity-50">${isAr ? 'لا توجد تقييمات مثبتة حالياً.' : 'No pinned reviews.'}</p>`;
            return;
        }

        container.innerHTML = reviews.map(rev => {
            const starsHtml = Array(5).fill(0).map((_, i) => 
                `<i data-lucide="star" class="w-4 h-4 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-700'}"></i>`
            ).join('');

            return `
            <div class="glass-card p-8 flex flex-col h-full">
                <div class="flex justify-between items-start mb-6">
                    <h3 class="text-xl font-black text-blue-600">${rev.reviewerName}</h3>
                    <div class="flex gap-1 filter drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]">${starsHtml}</div>
                </div>
                <p class="text-slate-600 dark:text-slate-400 italic leading-relaxed flex-grow">"${rev.message}"</p>
            </div>
            `;
        }).join('');
        lucide.createIcons();
    } catch (e) { container.innerHTML = ""; }
}

// --- 5. التحكم في البوب أب وإرسال الرسائل ---
function showPopup() { document.getElementById('success-popup').classList.add('popup-show'); }
function closePopup() { document.getElementById('success-popup').classList.remove('popup-show'); }

document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-send-message');
    const originalBtnText = submitBtn.innerText;
    const isAr = document.documentElement.dir === 'rtl';
    
    submitBtn.innerText = isAr ? 'جاري الإرسال...' : 'Sending...';
    submitBtn.disabled = true;

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };

    try {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showPopup();
            e.target.reset();
        }
    } catch (err) { alert(isAr ? 'خطأ في الاتصال' : 'Connection Error'); }
    finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
});

// --- 6. تغيير اللغة الشامل (AR/EN) ---
function applyLanguage(lang) {
    const isAr = lang === 'ar';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.getElementById('lang-toggle').innerText = isAr ? 'EN' : 'AR';
    
    const nameEl = document.getElementById('hero-name');
    const navProjects = document.querySelectorAll('.nav-projects');
    const navReviews = document.querySelectorAll('.nav-reviews');
    const navContact = document.querySelectorAll('.nav-contact');
    
    if (isAr) {
        nameEl.innerHTML = `<span class="text-slate-900 dark:text-white">محمد</span> <span class="text-blue-500">أبوالمجد</span>`;
        document.getElementById('projects-head').innerText = 'المشاريع';
        document.getElementById('reviews-head').innerText = 'آراء العملاء';
        document.getElementById('contact-head').innerText = 'ارسل لي رسالة';
        document.getElementById('btn-all-projects').innerText = 'رؤية جميع المشاريع';
        document.getElementById('btn-all-reviews').innerText = 'رؤية جميع التقييمات';
        document.getElementById('btn-add-review').innerText = 'أضف تقييمك';
        document.getElementById('btn-send-message').innerText = 'إرسال الرسالة';
        document.getElementById('name').placeholder = 'الاسم';
        document.getElementById('email').placeholder = 'البريد الإلكتروني';
        document.getElementById('message').placeholder = 'رسالتك...';
        document.getElementById('popup-head').innerText = 'تم الإرسال!';
        document.getElementById('popup-msg').innerText = 'تم إرسال رسالتك بنجاح.';
        document.getElementById('popup-btn').innerText = 'إغلاق';
        navProjects.forEach(el => el.innerText = 'المشاريع');
        navReviews.forEach(el => el.innerText = 'التقييمات');
        navContact.forEach(el => el.innerText = 'تواصل معي');
    } else {
        nameEl.innerHTML = `<span class="text-slate-900 dark:text-white">Muhammad</span> <span class="text-blue-500">Abu El-Magd</span>`;
        document.getElementById('projects-head').innerText = 'Projects';
        document.getElementById('reviews-head').innerText = 'Client Reviews';
        document.getElementById('contact-head').innerText = 'Get In Touch';
        document.getElementById('btn-all-projects').innerText = 'View All Projects';
        document.getElementById('btn-all-reviews').innerText = 'View All Reviews';
        document.getElementById('btn-add-review').innerText = 'Add Review';
        document.getElementById('btn-send-message').innerText = 'Send Message';
        document.getElementById('name').placeholder = 'Name';
        document.getElementById('email').placeholder = 'Email';
        document.getElementById('message').placeholder = 'Message...';
        document.getElementById('popup-head').innerText = 'Sent!';
        document.getElementById('popup-msg').innerText = 'Your message has been delivered.';
        document.getElementById('popup-btn').innerText = 'Close';
        navProjects.forEach(el => el.innerText = 'Projects');
        navReviews.forEach(el => el.innerText = 'Reviews');
        navContact.forEach(el => el.innerText = 'Contact');
    }
    fetchProjects();
    fetchRecentReviews();
}

document.getElementById('lang-toggle').addEventListener('click', function() {
    const newLang = document.documentElement.dir === 'rtl' ? 'en' : 'ar';
    localStorage.setItem('lang', newLang); 
    applyLanguage(newLang);
});

// تسجيل زيارة الموقع
window.addEventListener('DOMContentLoaded', () => {
    if(!sessionStorage.getItem('site_visited')) {
        fetch('/api/visit', { method: 'POST' }).catch(err => console.log(err));
        sessionStorage.setItem('site_visited', 'true');
    }
});

// تشغيل الدوال عند تحميل الصفحة
fetchProjects();
fetchRecentReviews();