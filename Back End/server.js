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
            sender: { name: "Muhammad Portfolio", email: "mv7mdvboelmaged@gmail.com" }, // المرسل المفعل
            to: [{ email: "mv7mdvboelmagd@gmail.com", name: "Muhammad" }], // المستلم (إيميلك المفضل)
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

// 1. تواصل معي (ستايل أزرق احترافي)
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        const htmlContent = `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #2563eb; padding: 25px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">📩 رسالة تواصل جديدة</h2>
                </div>
                <div style="padding: 30px; color: #1e293b;">
                    <p style="font-size: 16px; margin-bottom: 20px;">مرحباً محمد، لديك رسالة جديدة من الموقع الشخصي:</p>
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border-right: 5px solid #2563eb;">
                        <p style="margin: 0 0 10px 0;"><strong>👤 الاسم:</strong> ${name}</p>
                        <p style="margin: 0 0 15px 0;"><strong>📧 البريد:</strong> <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                        <p style="margin: 0; line-height: 1.6; color: #334155;"><strong>📝 الرسالة:</strong><br>${message}</p>
                    </div>
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="mailto:${email}" style="background-color: #2563eb; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">الرد على الرسالة</a>
                    </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                    هذا الإشعار مرسل تلقائياً من Portfolio الخاص بك
                </div>
            </div>`;

        const success = await sendEmailViaBrevo(`🚀 تواصل جديد: ${name}`, htmlContent, email);
        res.json({ success });
    } catch (error) { res.status(500).json({ success: false }); }
});

// 2. إرسال تقييم (ستايل ذهبي فخم)
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
                <div style="padding: 30px; color: #1e293b;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="font-size: 40px; margin-bottom: 10px;">${starsHtml}</div>
                        <p style="font-size: 18px; font-weight: bold; color: #b45309; margin: 0;">تقييم ${rating} نجوم</p>
                    </div>
                    <div style="background-color: #fffbeb; border-radius: 12px; padding: 20px; border: 1px dashed #fbbf24;">
                        <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>👤 كاتب التقييم:</strong> ${reviewerName}</p>
                        <hr style="border: 0; border-top: 1px solid #fef3c7; margin: 15px 0;">
                        <p style="margin: 0; line-height: 1.6; font-style: italic; color: #451a03; font-size: 17px;">"${message}"</p>
                    </div>
                    <p style="margin-top: 25px; font-size: 14px; text-align: center; color: #64748b;">يجب عليك الدخول إلى لوحة التحكم للموافقة على نشر التقييم.</p>
                </div>
            </div>`;

        await sendEmailViaBrevo(`⭐ تقييم جديد: ${reviewerName}`, htmlContent);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

// --- باقي الـ APIs بدون تغيير ---
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

app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    const visitInfo = await Visit.findOne({ id: "main_counter" });
    res.json({ visits: visitInfo ? visitInfo.count : 0 });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Front End', 'main-page', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});