lucide.createIcons();

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            
            scrollObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

function observeElements() {
    document.querySelectorAll('.reveal:not(.active)').forEach(el => scrollObserver.observe(el));
}

window.addEventListener('DOMContentLoaded', () => {
    observeElements();
});

const savedLang = localStorage.getItem('lang') || 'ar';
const isDark = localStorage.getItem('theme') !== 'light'; 

// تطبيق اللغة المبدئية
applyLanguage(savedLang);

document.getElementById('theme-toggle').addEventListener('click', () => {
    const newTheme = document.documentElement.classList.toggle('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
});

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

document.getElementById('lang-toggle').addEventListener('click', function() {
    const currentLang = localStorage.getItem('lang') === 'en' ? 'ar' : 'en';
    localStorage.setItem('lang', currentLang);
    applyLanguage(currentLang);
});

async function fetchProjects() {
    const container = document.getElementById('projects-container');
    const isAr = document.documentElement.dir === 'rtl';
    
    try {
        const res = await fetch('/api/projects');
        if (res.ok) {
            const dbProjects = await res.json();
            
            if (dbProjects.length === 0) {
                container.innerHTML = `<p class="text-center col-span-full text-slate-500 reveal fade-up">${isAr ? 'لا توجد مشاريع حالياً' : 'No projects found'}</p>`;
                observeElements();
                return;
            }

            container.innerHTML = dbProjects.map((p, index) => `
                <div class="glass-card p-0 overflow-hidden group hover:-translate-y-3 transition-all duration-500 hover:shadow-blue-500/10 flex flex-col h-full reveal fade-up" style="transition-delay: ${index * 0.1}s">
                    
                    <div class="relative h-56 w-full overflow-hidden bg-slate-200 dark:bg-slate-800/50">
                        ${p.imageUrl 
                            ? `<img src="${p.imageUrl}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">`
                            : `<div class="w-full h-full flex items-center justify-center text-slate-400"><i data-lucide="image" class="w-12 h-12"></i></div>`
                        }
                        <div class="absolute top-4 ${isAr ? 'right-4' : 'left-4'} bg-blue-600/90 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg z-10">
                            ${p.category || 'Web'}
                        </div>
                    </div>
                    
                    <div class="p-8 flex flex-col flex-grow">
                        <h3 class="text-2xl font-black mb-4 group-hover:text-blue-500 transition-colors">${p.title}</h3>
                        <p class="text-slate-500 dark:text-slate-400 mb-8 flex-grow text-sm md:text-base leading-relaxed">
                            ${isAr ? (p.description || p.descriptionEn) : (p.descriptionEn || p.description)}
                        </p>
                        <a href="${p.link || '#'}" target="_blank" class="inline-flex items-center gap-2 font-black text-sm text-blue-600 group-hover:gap-4 transition-all uppercase w-fit mt-auto">
                            ${isAr ? 'عرض المشروع' : 'Open Project'} <i data-lucide="external-link" class="w-4 h-4"></i>
                        </a>
                    </div>

                </div>
            `).join('');
            
            lucide.createIcons();
            observeElements();
        }
    } catch (e) {
        console.log("Error fetching projects:", e);
        container.innerHTML = `<p class="text-center col-span-full text-red-500 reveal fade-up">فشل تحميل المشاريع</p>`;
        observeElements();
    }
}