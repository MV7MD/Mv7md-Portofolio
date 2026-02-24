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

const savedLang = localStorage.getItem('lang') || 'ar';
if (savedLang === 'en') {
    applyLanguage('en');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
});

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


async function fetchProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    const isAr = document.documentElement.dir === 'rtl';

    try {
        const res = await fetch('/api/projects/home');
        if(!res.ok) throw new Error("Server Error");
        const dbProjects = await res.json();

        if (!Array.isArray(dbProjects) || dbProjects.length === 0) {
            container.innerHTML = `<p class="col-span-full text-center opacity-50">${isAr ? 'لا توجد مشاريع مثبتة حالياً.' : 'No pinned projects.'}</p>`;
        } else {
            container.innerHTML = dbProjects.map((p, index) => `
                <div class="glass-card p-0 overflow-hidden group hover:-translate-y-3 transition-all duration-500 hover:shadow-blue-500/10 flex flex-col h-full reveal fade-up" style="transition-delay: ${index * 0.1}s">
                    <div class="relative h-56 w-full overflow-hidden bg-slate-200 dark:bg-slate-800/50">
                        ${p.imageUrl 
                            ? `<img src="${p.imageUrl}" alt="Project Image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">`
                            : `<div class="w-full h-full flex items-center justify-center text-slate-400"><i data-lucide="image" class="w-12 h-12"></i></div>`
                        }
                        <div class="absolute top-4 ${isAr ? 'right-4' : 'left-4'} bg-blue-600/90 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg z-10">
                            ${p.category || 'Web'}
                        </div>
                    </div>
                    <div class="p-8 flex flex-col flex-grow">
                        <h3 class="text-2xl font-black mb-4 group-hover:text-blue-500 transition-colors">${p.title || 'بدون عنوان'}</h3>
                        <p class="text-slate-500 dark:text-slate-400 mb-8 flex-grow text-sm md:text-base leading-relaxed">
                            ${isAr ? (p.description || p.descriptionEn || '') : (p.descriptionEn || p.description || '')}
                        </p>
                        <a href="${p.link || '#'}" target="_blank" class="inline-flex items-center gap-2 font-black text-sm text-blue-600 group-hover:gap-4 transition-all uppercase w-fit mt-auto">
                            ${isAr ? 'عرض المشروع' : 'Open Project'} <i data-lucide="external-link" class="w-4 h-4"></i>
                        </a>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) { 
        console.log("خطأ في الاتصال بالمشاريع");
    } finally {
        lucide.createIcons();
        observeElements(); 
    }
}


async function fetchRecentReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    const isAr = document.documentElement.dir === 'rtl';
    
    try {
        const res = await fetch('/api/reviews/home');
        if(!res.ok) throw new Error("Server Error");
        const reviews = await res.json();
        
        if (!Array.isArray(reviews) || reviews.length === 0) {
            container.innerHTML = `<p class="col-span-full text-center opacity-50">${isAr ? 'لا توجد تقييمات مثبتة حالياً.' : 'No pinned reviews.'}</p>`;
        } else {
            container.innerHTML = reviews.map((rev, index) => {
                const starsHtml = Array(5).fill(0).map((_, i) => 
                    `<i data-lucide="star" class="w-4 h-4 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-700'}"></i>`
                ).join('');

                return `
                <div class="glass-card p-8 flex flex-col h-full reveal fade-up" style="transition-delay: ${index * 0.1}s">
                    <div class="flex justify-between items-start mb-6">
                        <h3 class="text-xl font-black text-blue-600">${rev.reviewerName || 'مستخدم'}</h3>
                        <div class="flex gap-1 filter drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]">${starsHtml}</div>
                    </div>
                    <p class="text-slate-600 dark:text-slate-400 italic leading-relaxed flex-grow">"${rev.message || ''}"</p>
                </div>
                `;
            }).join('');
        }
    } catch (e) { 
        console.log("خطأ في الاتصال بالتقييمات");
    } finally {
        lucide.createIcons();
        observeElements(); 
    }
}

async function fetchProfilePic() {
    try {
        const res = await fetch('/api/profile-pic');
        const data = await res.json();
        if (res.ok && data.success && data.url) {
            const profileImg = document.getElementById('profile-pic');
            if (profileImg) {
                profileImg.src = data.url;
            }
        }
    } catch (error) {
        console.log("خطأ في جلب الصورة الشخصية");
    }
}


async function fetchSkills() {
    const container = document.getElementById('skills-container');
    if (!container) return;
    try {
        const res = await fetch('/api/skills');
        const skills = await res.json();
        if(Array.isArray(skills) && skills.length > 0) {
            container.innerHTML = skills.map((skill, index) => `
                <span class="px-4 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-xl border border-blue-500/20 text-sm md:text-base cursor-default reveal zoom-in transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:border-blue-500" style="transition-delay: ${index * 0.1}s">
                    ${skill.name}
                </span>
            `).join('');
            observeElements();
        }
    } catch (e) {
        console.log("خطأ في جلب المهارات");
    }
}

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
        } else {
                alert(isAr ? 'حدث خطأ، يرجى المحاولة مرة أخرى.' : 'An error occurred, please try again.');
        }
    } catch (err) { 
        console.error('Fetch error:', err);
        alert(isAr ? 'خطأ في الاتصال بالسيرفر' : 'Server Connection Error'); 
    }
    finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
});

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


function optimizeSocialAnimations() {
    const socialLinks = document.querySelectorAll('a[href*="github"], a[href*="wa.me"], a[href*="whatsapp"], a[href*="mailto"], a[href*="linkedin"]');
    
    socialLinks.forEach(link => {
        link.style.transition = "all 0.2s ease-out";
        
        link.addEventListener('mouseenter', () => {
            link.style.transform = 'translateY(-5px) scale(1.1)';
            if(link.href.includes('github')) {
                link.style.filter = 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.6))';
            } else if(link.href.includes('wa.me') || link.href.includes('whatsapp')) {
                link.style.filter = 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.7))'; 
            } else if(link.href.includes('linkedin')) {
                link.style.filter = 'drop-shadow(0 0 12px rgba(10, 102, 194, 0.7))'; 
            } else if(link.href.includes('mailto')) {
                link.style.filter = 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.7))'; 
            } else {
                link.style.filter = 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.7))'; 
            }
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.transform = 'translateY(0) scale(1)';
            link.style.filter = 'drop-shadow(0 0 0 rgba(0,0,0,0))';
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    if(!sessionStorage.getItem('site_visited')) {
        fetch('/api/visit', { method: 'POST' }).catch(err => console.log(err));
        sessionStorage.setItem('site_visited', 'true');
    }
    fetchProjects();
    fetchRecentReviews();
    fetchProfilePic();
    fetchSkills(); 
    
    optimizeSocialAnimations();
    
    setTimeout(() => { observeElements(); }, 100);
});