lucide.createIcons();

// --- 1. استرجاع الحالة المحفوظة وتطبيقها فوراً ---
const savedLang = localStorage.getItem('lang') || 'ar';
applyLanguage(savedLang);

// --- 2. نظام النجوم التفاعلي ---
const stars = document.querySelectorAll('.interactive-stars .star');
const ratingInput = document.getElementById('ratingValue');

stars.forEach(star => {
    star.addEventListener('click', () => {
        stars.forEach(s => s.classList.remove('active'));
        star.classList.add('active');
        ratingInput.value = star.getAttribute('data-value');
    });
});

// --- 3. تبديل الثيم وحفظه ---
document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// --- 🌟 دوال التحكم في البوب أب 🌟 ---
function showPopup() { 
    document.getElementById('success-popup').classList.add('popup-show'); 
}
function closePopup() { 
    document.getElementById('success-popup').classList.remove('popup-show'); 
}

// --- 4. دالة تطبيق اللغة الشاملة ---
function applyLanguage(lang) {
    const isAr = lang === 'ar';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.getElementById('lang-toggle').innerText = isAr ? 'EN' : 'AR';
    
    // تحديث النصوص بناءً على اللغة
    document.getElementById('page-title').innerHTML = isAr 
        ? 'شاركنا <span class="text-blue-500">رأيك</span>'
        : 'Share Your <span class="text-blue-500">Opinion</span>';

    document.getElementById('form-head').innerText = isAr ? 'اترك بصمتك هنا 👇' : 'Leave your mark here 👇';
    document.getElementById('reviewerName').placeholder = isAr ? 'الاسم' : 'Name';
    document.getElementById('reviewMessage').placeholder = isAr ? 'رأيك بكل صراحة...' : 'Your Message...';
    document.getElementById('submit-btn').innerText = isAr ? 'إرسال التقييم 🚀' : 'Submit Review 🚀';
    document.getElementById('rating-label').innerText = isAr ? 'التقييم:' : 'Rating:';
    
    // 🌟 ترجمة البوب أب 🌟
    document.getElementById('popup-head').innerText = isAr ? 'تم الإرسال!' : 'Sent!';
    document.getElementById('popup-msg').innerText = isAr ? 'تم إرسال تقييمك بنجاح، شكراً لك ❤️' : 'Review submitted successfully, thank you ❤️';
    document.getElementById('popup-btn').innerText = isAr ? 'إغلاق' : 'Close';
}

// --- 5. زرار تبديل اللغة ---
document.getElementById('lang-toggle').addEventListener('click', function() {
    const currentLang = localStorage.getItem('lang') || 'ar';
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    
    localStorage.setItem('lang', newLang);
    applyLanguage(newLang);
});

// --- 6. إرسال التقييم ---
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (ratingInput.value === "0") {
        const isAr = document.documentElement.dir === 'rtl';
        alert(isAr ? "برجاء اختيار تقييم من النجوم ⭐" : "Please select a star rating ⭐");
        return;
    }

    const data = {
        reviewerName: document.getElementById('reviewerName').value,
        message: document.getElementById('reviewMessage').value,
        rating: document.getElementById('ratingValue').value
    };

    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerText;
    const isAr = document.documentElement.dir === 'rtl';
    
    submitBtn.innerText = isAr ? 'جاري الإرسال...' : 'Sending...';
    submitBtn.disabled = true;

    try {
        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            // 🌟 إظهار البوب أب بدل الـ Alert 🌟
            showPopup();
            
            e.target.reset();
            stars.forEach(s => s.classList.remove('active'));
            ratingInput.value = "0";
        }
    } catch (err) {
        console.error("لم يتم الاتصال بالسيرفر");
    } finally {
        submitBtn.innerText = isAr ? 'إرسال التقييم 🚀' : 'Submit Review 🚀';
        submitBtn.disabled = false;
    }
});