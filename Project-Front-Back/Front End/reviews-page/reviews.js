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
applyLanguage(savedLang);


const stars = document.querySelectorAll('.interactive-stars .star');
const ratingInput = document.getElementById('ratingValue');

stars.forEach(star => {
    star.addEventListener('click', () => {
        stars.forEach(s => s.classList.remove('active'));
        star.classList.add('active');
        ratingInput.value = star.getAttribute('data-value');
    });
});


document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});


function showPopup() { 
    document.getElementById('success-popup').classList.add('popup-show'); 
}
function closePopup() { 
    document.getElementById('success-popup').classList.remove('popup-show'); 
}


function applyLanguage(lang) {
    const isAr = lang === 'ar';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.getElementById('lang-toggle').innerText = isAr ? 'EN' : 'AR';
    
    
    document.getElementById('page-title').innerHTML = isAr 
        ? 'شاركنا <span class="text-blue-500">رأيك</span>'
        : 'Share Your <span class="text-blue-500">Opinion</span>';

    document.getElementById('form-head').innerText = isAr ? 'اترك بصمتك هنا 👇' : 'Leave your mark here 👇';
    document.getElementById('reviewerName').placeholder = isAr ? 'الاسم' : 'Name';
    document.getElementById('reviewMessage').placeholder = isAr ? 'رأيك بكل صراحة...' : 'Your Message...';
    document.getElementById('submit-btn').innerText = isAr ? 'إرسال التقييم 🚀' : 'Submit Review 🚀';
    document.getElementById('rating-label').innerText = isAr ? 'التقييم:' : 'Rating:';
    
    
    document.getElementById('popup-head').innerText = isAr ? 'تم الإرسال!' : 'Sent!';
    document.getElementById('popup-msg').innerText = isAr ? 'تم إرسال تقييمك بنجاح، شكراً لك ❤️' : 'Review submitted successfully, thank you ❤️';
    document.getElementById('popup-btn').innerText = isAr ? 'إغلاق' : 'Close';
}


document.getElementById('lang-toggle').addEventListener('click', function() {
    const currentLang = localStorage.getItem('lang') || 'ar';
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    
    localStorage.setItem('lang', newLang);
    applyLanguage(newLang);
});


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