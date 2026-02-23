require('dotenv').config(); 

// 🚀 إجبار السيرفر على استخدام IPv4 أولاً لحل مشكلة الاتصال في Railway
require('dns').setDefaultResultOrder('ipv4first'); 

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const Project = require('./models/Project');
const Review = require('./models/Review');
const Visit = require('./models/Visit');

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json());

// مسارات ملفات الفرونت إند
app.use(express.static(path.join(__dirname, 'Front End')));
app.use(express.static(path.join(__dirname, 'Front End', 'main-page')));

// 🔗 الاتصال بقاعدة البيانات
mongoose.connect(process.env.DB_URI)
    .then(() => console.log('✅✅✅ تم الربط بالسحاب بنجاح!'))
    .catch((err) => console.error('❌ فشل الاتصال بالسحاب:', err.message));

// 🚀 دالة إرسال الإيميلات عبر Brevo API (باستخدام الـ API Key الجديد)
async function sendEmailViaBrevo(subject, htmlContent, replyTo = null) {
    const apiKey = process.env.BREVO_API_KEY; // المفتاح اللي بيبدأ بـ xkeysib

    if (!apiKey) {
        console.error("❌ خطأ: BREVO_API_KEY غير موجود في إعدادات Railway!");
        return false;
    }

    try {
        const body = {
            sender: { name: "Muhammad Portfolio", email: "mv7mdvboelmaged@gmail.com" },
            to: [{ email: "mv7mdvboelmaged@gmail.com", name: "Muhammad" }],
            subject: subject,
            htmlContent: htmlContent
        };

        if (replyTo) {
            body.replyTo = { email: replyTo };
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Brevo API Response Error:", errorData.message);
            return false;
        }

        console.log("✅✅✅ تم إرسال الإيميل بنجاح عبر Brevo API");
        return true;
    } catch (error) {
        console.error("❌ Network Error while calling Brevo:", error.message);
        return false;
    }
}

// --- وسيط حماية الأدمن ---
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization;
    if (token === `Bearer ${process.env.SECRET_TOKEN}`) {
        next(); 
    } else {
        res.status(401).json({ success: false, message: "غير مصرح لك بالدخول!" }); 
    }
};

app.post('/api/admin/login', (req, res) => {
    if (req.body.password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true, token: process.env.SECRET_TOKEN });
    } else {
        res.status(401).json({ success: false, message: "كلمة المرور خاطئة!" });
    }
});

// --- APIs الزوار ---

// تواصل معي
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        const htmlContent = `
            <div dir="rtl" style="font-family: Arial; padding: 20px; border: 1px solid #3b82f6; border-radius: 10px;">
                <h2 style="color: #3b82f6;">رسالة تواصل جديدة!</h2>
                <p><strong>المرسل:</strong> ${name}</p>
                <p><strong>البريد:</strong> ${email}</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin-top: 10px;">
                    ${message}
                </div>
            </div>`;

        const success = await sendEmailViaBrevo(`🚀 رسالة تواصل جديدة من: ${name}`, htmlContent, email);
        
        if (success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, message: "Email service failed" });
        }
    } catch (error) { 
        console.error("❌ Contact Route Error:", error.message);
        res.status(500).json({ success: false }); 
    }
});

// إرسال تقييم جديد
app.post('/api/reviews', async (req, res) => {
    const { reviewerName, message, rating } = req.body;
    try {
        const newReview = new Review({ reviewerName, message, rating });
        await newReview.save();
        
        const starsHtml = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
        const htmlContent = `
            <div dir="rtl" style="font-family: Arial; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #fbbf24;">تقييم جديد بانتظار موافقتك!</h2>
                <p><strong>العميل:</strong> ${reviewerName}</p>
                <p><strong>التقييم:</strong> ${starsHtml}</p>
                <p style="background: #f9f9f9; padding: 10px; border-right: 4px solid #fbbf24;">"${message}"</p>
            </div>`;

        await sendEmailViaBrevo(`⭐ تقييم جديد معلق من: ${reviewerName}`, htmlContent);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

// دالة الزيارات
app.post('/api/visit', async (req, res) => {
    try {
        let visitInfo = await Visit.findOneAndUpdate(
            { id: "main_counter" },
            { $inc: { count: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        res.json({ success: true, count: visitInfo.count });
    } catch (error) { res.status(500).json({ success: false }); }
});

// جلب المشاريع والتقييمات
app.get('/api/projects/home', async (req, res) => {
    try {
        const projects = await Project.find({ showOnHome: true, isVisible: true }).limit(2).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/api/reviews/home', async (req, res) => {
    try {
        const reviews = await Review.find({ showOnHome: true, isApproved: true }).limit(2).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

// --- APIs الأدمن (يجب أن تظل محمية) ---
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    const visitInfo = await Visit.findOne({ id: "main_counter" });
    res.json({ visits: visitInfo ? visitInfo.count : 0 });
});

app.get('/api/admin/projects', verifyAdmin, async (req, res) => {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
});

app.get('/api/admin/reviews', verifyAdmin, async (req, res) => {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
});

// مسار الدخول للموقع
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Front End', 'main-page', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});