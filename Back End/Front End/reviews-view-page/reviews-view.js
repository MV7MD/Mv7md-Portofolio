lucide.createIcons();

// --- 🌟 قراءة اللغة المحفوظة وتطبيقها فوراً 🌟 ---
let savedLang = localStorage.getItem('lang') || 'ar';
let isAr = savedLang === 'ar';

function applySavedLanguage() {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.getElementById('lang-toggle').innerText = isAr ? 'EN' : 'AR';
    
    document.getElementById('page-title').innerHTML = isAr 
        ? 'آراء <span class="text-blue-500">العملاء</span> والزوار'
        : 'Client <span class="text-blue-500">Reviews</span>';
        
    document.getElementById('add-review-btn').innerHTML = isAr 
        ? 'أضف تقييمك <i data-lucide="pen-line" class="w-5 h-5 inline-block"></i>' 
        : 'Add Review <i data-lucide="pen-line" class="w-5 h-5 inline-block"></i>';
        
    lucide.createIcons();
}

// تطبيق اللغة أول ما الملف يقرأ
applySavedLanguage();

// --- تبديل الثيم وحفظه للمين بيج ---
document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// --- تبديل اللغة وحفظها للمين بيج ---
document.getElementById('lang-toggle').addEventListener('click', function() {
    isAr = !isAr;
    localStorage.setItem('lang', isAr ? 'ar' : 'en');
    applySavedLanguage();
    fetchReviews(); // ريفريش للكروت عشان التاريخ يتظبط لغته
});

// --- جلب وعرض التقييمات ---
async function fetchReviews() {
    const container = document.getElementById('reviews-container');
    
    try {
        const res = await fetch('/api/reviews');
        if (!res.ok) throw new Error('Error');
        const reviews = await res.json();
        
        if (reviews.length === 0) {
            container.innerHTML = `<p class="col-span-full text-center opacity-50 text-lg">${isAr ? 'لا توجد تقييمات حتى الآن.' : 'No reviews yet.'}</p>`;
            return;
        }

        container.innerHTML = reviews.map((rev, index) => {
            const delay = index * 0.2; 
            const starsHtml = Array(5).fill(0).map((_, i) => 
                `<i data-lucide="star" class="w-4 h-4 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-700'}"></i>`
            ).join('');

            return `
            <div class="glass-card p-8 review-card hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full" style="animation-delay: ${delay}s">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-xl font-black text-blue-600 dark:text-blue-400">${rev.reviewerName}</h3>
                        <div class="flex gap-1 mt-2 filter drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]">
                            ${starsHtml}
                        </div>
                    </div>
                    <div class="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
                        <i data-lucide="quote" class="w-5 h-5"></i>
                    </div>
                </div>
                
                <p class="text-slate-600 dark:text-slate-400 italic leading-relaxed flex-grow text-lg">
                    "${rev.message}"
                </p>
                
                <div class="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200 dark:border-slate-800 pt-4">
                    ${new Date(rev.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>
            `;
        }).join('');
        lucide.createIcons();

    } catch (error) {
        container.innerHTML = ""; 
    }
}

fetchReviews();