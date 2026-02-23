lucide.createIcons();

// --- 1. استرجاع الحالة المحفوظة وتطبيقها ---
const savedLang = localStorage.getItem('lang') || 'ar';
const isDark = localStorage.getItem('theme') !== 'light'; 

// تطبيق اللغة المبدئية
applyLanguage(savedLang);

// --- 2. تبديل الثيم وحفظه ---
document.getElementById('theme-toggle').addEventListener('click', () => {
    const newTheme = document.documentElement.classList.toggle('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
});

// --- 3. دالة تطبيق اللغة ---
function applyLanguage(lang) {
    const isAr = lang === 'ar';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.getElementById('lang-toggle').innerText = isAr ? 'EN' : 'AR';
    
    const head = document.getElementById('projects-head');
    if (isAr) {
        head.innerHTML = 'معرض <span class="text-blue-500">المشاريع</span>';
    } else {
        head.innerHTML = 'My <span class="text-blue-500">Projects</span>';
    }

    fetchProjects(); 
}

// --- 4. زرار تبديل اللغة ---
document.getElementById('lang-toggle').addEventListener('click', function() {
    const currentLang = localStorage.getItem('lang') === 'en' ? 'ar' : 'en';
    localStorage.setItem('lang', currentLang);
    applyLanguage(currentLang);
});

// --- 5. جلب المشاريع من الباك إند (تم حذف الكود اليدوي) ---
async function fetchProjects() {
    const container = document.getElementById('projects-container');
    const isAr = document.documentElement.dir === 'rtl';
    
    // تم حذف مصفوفة WeatherX اليدوية من هنا ليعمل الموقع ديناميكياً بالكامل

    try {
        const res = await fetch('/api/projects');
        if (res.ok) {
            const dbProjects = await res.json();
            
            if (dbProjects.length === 0) {
                container.innerHTML = `<p class="text-center col-span-full text-slate-500">${isAr ? 'لا توجد مشاريع حالياً' : 'No projects found'}</p>`;
                return;
            }

            container.innerHTML = dbProjects.map(p => `
                <div class="glass-card p-10 group hover:-translate-y-3 transition-all duration-500 flex flex-col h-full">
                    <div class="flex justify-between items-center mb-8">
                        <div class="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                            <i data-lucide="layout-template"></i>
                        </div>
                        <span class="text-[10px] font-black tracking-widest text-blue-500 uppercase">${p.category || 'Web'}</span>
                    </div>
                    <h3 class="text-2xl font-black mb-4 group-hover:text-blue-500 transition-colors">${p.title}</h3>
                    <p class="text-slate-500 dark:text-slate-400 mb-8 flex-grow">
                        ${isAr ? (p.description || p.descriptionEn) : (p.descriptionEn || p.description)}
                    </p>
                    <a href="${p.link || '#'}" target="_blank" class="inline-flex items-center gap-2 font-black text-sm text-blue-600 group-hover:gap-4 transition-all uppercase w-fit">
                        ${isAr ? 'عرض المشروع' : 'Open Project'} <i data-lucide="external-link" class="w-4 h-4"></i>
                    </a>
                </div>
            `).join('');
            
            lucide.createIcons();
        }
    } catch (e) {
        console.log("Error fetching projects:", e);
        container.innerHTML = `<p class="text-center col-span-full text-red-500">فشل تحميل المشاريع</p>`;
    }
}