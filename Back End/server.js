require('dotenv').config(); // تحميل المتغيرات من ملف .env

// 🚀 التعديل السحري: إجبار السيرفر على استخدام IPv4 لحل مشكلة Railway مع جوجل
require('dns').setDefaultResultOrder('ipv4first'); 

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
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
const DB_URI = process.env.DB_URI;

mongoose.connect(DB_URI, {
    serverSelectionTimeoutMS: 5000 
})
    .then(() => console.log('✅✅✅ تم الربط بالسحاب بنجاح!'))
    .catch((err) => {
        console.error('❌ فشل الاتصال بالسحاب. تأكد من إعدادات الـ Environment Variables');
        console.error('تفاصيل الخطأ:', err.message);
    });

// 🚀 التعديل النهائي للإيميل: استخدام بورت 587 مع إعدادات الـ TLS الصحيحة
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    requireTLS: true, 
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    },
    connectionTimeout: 10000 
});

// دالة اختبار الإيميل أول ما السيرفر يشتغل
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ خطأ كارثي في إعدادات الإيميل:', error.message);
    } else {
        console.log('✅✅✅ سيرفر الإيميلات متصل وجاهز للإرسال!');
    }
});

// متغيرات الحماية من ملف الـ .env
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; 
const SECRET_TOKEN = process.env.SECRET_TOKEN; 

const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization;
    if (token === `Bearer ${SECRET_TOKEN}`) {
        next(); 
    } else {
        res.status(401).json({ success: false, message: "غير مصرح لك بالدخول!" }); 
    }
};

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, token: SECRET_TOKEN });
    } else {
        res.status(401).json({ success: false, message: "كلمة المرور خاطئة!" });
    }
});

// --- APIs الزوار ---

app.get('/api/projects/home', async (req, res) => {
    try {
        const projects = await Project.find({ showOnHome: true, isVisible: true }).limit(2).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find({ isVisible: true }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/api/reviews/home', async (req, res) => {
    try {
        const reviews = await Review.find({ showOnHome: true, isApproved: true }).limit(2).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ isApproved: true }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/api/reviews', async (req, res) => {
    const { reviewerName, message, rating } = req.body;
    try {
        const newReview = new Review({ reviewerName, message, rating });
        await newReview.save();
        const starsHtml = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `⭐ تقييم جديد معلق من: ${reviewerName}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; direction: rtl; text-align: right;">
                <div style="background-color: #fbbf24; padding: 20px; text-align: center;">
                    <h2 style="color: #fff; margin: 0; font-size: 24px;">تقييم جديد بانتظار موافقتك! 🌟</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #475569; margin-bottom: 20px;">مرحباً محمد،</p>
                    <p style="font-size: 16px; color: #475569;">هناك شخص قام للتو بتقييم البورتفوليو الخاص بك. يرجى مراجعة التقييم قبل نشره.</p>
                    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>👤 العميل:</strong> <span style="color: #3b82f6;">${reviewerName}</span></p>
                        <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>⭐ التقييم:</strong> <span style="font-size: 20px; letter-spacing: 2px;">${starsHtml}</span></p>
                        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 15px 0;">
                        <p style="margin: 0; font-size: 18px; color: #0f172a; font-style: italic;">"${message}"</p>
                    </div>
                </div>
            </div>`
        });
        res.json({ success: true });
    } catch (error) { 
        console.error("❌ Email/Review Error: ", error); 
        res.status(500).json({ success: false }); 
    }
});

app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER, 
            to: process.env.EMAIL_USER,
            replyTo: email, 
            subject: `🚀 رسالة تواصل جديدة من: ${name}`, 
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; direction: rtl; text-align: right;">
                <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
                    <h2 style="color: #fff; margin: 0; font-size: 24px;">رسالة تواصل جديدة! 📩</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>👤 المرسل:</strong> ${name}</p>
                    <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📧 البريد:</strong> ${email}</p>
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <p style="margin: 0; font-size: 16px; color: #0f172a;">${message}</p>
                    </div>
                </div>
            </div>`
        });
        res.json({ success: true });
    } catch (error) { 
        console.error("❌ Contact Email Error: ", error); 
        res.status(500).json({ success: false }); 
    }
});

app.post('/api/visit', async (req, res) => {
    try {
        let visitInfo = await Visit.findOne({ id: "main_counter" });
        if (!visitInfo) {
            visitInfo = new Visit({ id: "main_counter", count: 1 });
        } else {
            visitInfo.count += 1;
        }
        await visitInfo.save();
        res.json({ success: true, count: visitInfo.count });
    } catch (error) { res.status(500).json({ success: false }); }
});

// --- APIs الأدمن المحمية ---

app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    try {
        const visitInfo = await Visit.findOne({ id: "main_counter" });
        res.json({ visits: visitInfo ? visitInfo.count : 0 });
    } catch (error) { res.status(500).json({ visits: 0 }); }
});

app.get('/api/admin/projects', verifyAdmin, async (req, res) => {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
});

app.get('/api/admin/reviews', verifyAdmin, async (req, res) => {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
});

app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
    const newProject = new Project(req.body);
    await newProject.save();
    res.json({ success: true });
});

app.delete('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.delete('/api/admin/reviews/:id', verifyAdmin, async (req, res) => {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.put('/api/admin/projects/:id/home', verifyAdmin, async (req, res) => {
    const project = await Project.findById(req.params.id);
    project.showOnHome = !project.showOnHome;
    await project.save();
    res.json({ success: true });
});

app.put('/api/admin/reviews/:id/approve', verifyAdmin, async (req, res) => {
    const review = await Review.findById(req.params.id);
    review.isApproved = !review.isApproved;
    await review.save();
    res.json({ success: true });
});

app.put('/api/admin/reviews/:id/home', verifyAdmin, async (req, res) => {
    const review = await Review.findById(req.params.id);
    review.showOnHome = !review.showOnHome;
    await review.save();
    res.json({ success: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Front End', 'main-page', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});