require('dotenv').config(); 

// 🚀 إجبار السيرفر على استخدام IPv4 لحل مشكلة Railway
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

app.use(express.static(path.join(__dirname, 'Front End')));
app.use(express.static(path.join(__dirname, 'Front End', 'main-page')));

// 🔗 الاتصال بقاعدة البيانات
mongoose.connect(process.env.DB_URI)
    .then(() => console.log('✅✅✅ تم الربط بالسحاب بنجاح!'))
    .catch((err) => console.error('❌ فشل الاتصال بالسحاب:', err.message));

// 🚀 دالة إرسال الإيميلات الاحترافية عبر Brevo
async function sendEmailViaBrevo(subject, htmlContent, replyTo = null) {
    const apiKey = process.env.BREVO_API_KEY;

    try {
        const body = {
            sender: { name: "Muhammad Portfolio", email: "mv7mdvboelmaged@gmail.com" },
            to: [{ email: "mv7mdvboelmagd@gmail.com", name: "Muhammad" }], 
            subject: subject,
            htmlContent: htmlContent
        };

        if (replyTo) { body.replyTo = { email: replyTo }; }

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
            console.error("❌ Brevo API Error:", JSON.stringify(errorData));
            return false;
        }

        console.log("✅✅✅ Email sent successfully!");
        return true;
    } catch (error) {
        console.error("❌ Network Error:", error.message);
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

app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        const htmlContent = `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #2563eb; padding: 25px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 22px;">📩 رسالة تواصل جديدة</h2>
                </div>
                <div style="padding: 30px; color: #1e293b;">
                    <p style="font-size: 16px;">مرحباً محمد، لديك رسالة جديدة:</p>
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border-right: 5px solid #2563eb;">
                        <p><strong>👤 الاسم:</strong> ${name}</p>
                        <p><strong>📧 البريد:</strong> <a href="mailto:${email}" style="color: #2563eb;">${email}</a></p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                        <p><strong>📝 الرسالة:</strong><br>${message}</p>
                    </div>
                </div>
            </div>`;

        const success = await sendEmailViaBrevo(`🚀 تواصل جديد: ${name}`, htmlContent, email);
        res.json({ success });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/reviews', async (req, res) => {
    const { reviewerName, message, rating } = req.body;
    try {
        const newReview = new Review({ reviewerName, message, rating });
        await newReview.save();
        
        const starsHtml = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
        const htmlContent = `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #fde68a; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); padding: 25px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 22px;">🌟 تقييم جديد بانتظار الموافقة</h2>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <div style="font-size: 40px;">${starsHtml}</div>
                    <div style="background-color: #fffbeb; border-radius: 12px; padding: 20px; border: 1px dashed #fbbf24; margin-top: 20px;">
                        <p><strong>👤 كاتب التقييم:</strong> ${reviewerName}</p>
                        <p style="font-style: italic;">"${message}"</p>
                    </div>
                </div>
            </div>`;

        await sendEmailViaBrevo(`⭐ تقييم جديد: ${reviewerName}`, htmlContent);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

// --- APIs الزيارات والمشاريع العامة ---
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

// --- 🛠️ الجزء المفقود: APIs الإدارة (Admin APIs) ---

app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    const visitInfo = await Visit.findOne({ id: "main_counter" });
    res.json({ visits: visitInfo ? visitInfo.count : 0 });
});

// جلب كل المشاريع للأدمن
app.get('/api/admin/projects', verifyAdmin, async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

// جلب كل التقييمات للأدمن (ليوافق عليها)
app.get('/api/admin/reviews', verifyAdmin, async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

// إضافة مشروع جديد
app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
    try {
        const newProject = new Project(req.body);
        await newProject.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

// مسح مشروع
app.delete('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

// الموافقة على تقييم أو رفضه
app.put('/api/admin/reviews/:id/approve', verifyAdmin, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        review.isApproved = !review.isApproved;
        await review.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

// مسح تقييم
app.delete('/api/admin/reviews/:id', verifyAdmin, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Front End', 'main-page', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});