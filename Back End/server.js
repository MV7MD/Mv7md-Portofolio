require('dotenv').config(); 

// 🚀 إجبار السيرفر على استخدام IPv4 أولاً لحل مشكلة الاتصال في Railway
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

app.use(express.static(path.join(__dirname, 'Front End')));
app.use(express.static(path.join(__dirname, 'Front End', 'main-page')));

// 🔗 الاتصال بقاعدة البيانات مع مهلة زمنية للمحاولة
mongoose.connect(process.env.DB_URI, {
    serverSelectionTimeoutMS: 5000 
})
    .then(() => console.log('✅✅✅ تم الربط بالسحاب بنجاح!'))
    .catch((err) => {
        console.error('❌ فشل الاتصال بالسحاب:', err.message);
    });

// 🚀 إعدادات Nodemailer المحسنة لـ Railway
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    },
    tls: {
        rejectUnauthorized: false, // ضروري لتخطي مشاكل الأمان في بيئات الاستضافة
        minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000, // 10 ثواني كحد أقصى للاتصال
    greetingTimeout: 5000,
    socketTimeout: 15000
});

// اختبار الاتصال فور التشغيل
transporter.verify((error) => {
    if (error) {
        console.error('❌ خطأ في إعدادات الإيميل:', error.message);
    } else {
        console.log('✅✅✅ سيرفر الإيميلات متصل وجاهز للإرسال!');
    }
});

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

// إرسال تقييم جديد مع تنبيه بالإيميل
app.post('/api/reviews', async (req, res) => {
    const { reviewerName, message, rating } = req.body;
    try {
        const newReview = new Review({ reviewerName, message, rating });
        await newReview.save();
        
        const starsHtml = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
        
        // إرسال الإيميل في الخلفية دون تعطيل الرد على المستخدم
        transporter.sendMail({
            from: `"vScout Notifications" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `⭐ تقييم جديد معلق من: ${reviewerName}`,
            html: `
                <div dir="rtl" style="font-family: Arial; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #fbbf24;">تقييم جديد بانتظار موافقتك!</h2>
                    <p><strong>العميل:</strong> ${reviewerName}</p>
                    <p><strong>التقييم:</strong> ${starsHtml}</p>
                    <p style="background: #f9f9f9; padding: 10px; border-right: 4px solid #fbbf24;">"${message}"</p>
                </div>`
        }).catch(err => console.error("Email Error:", err.message));

        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false }); 
    }
});

// تواصل معي
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        await transporter.sendMail({
            from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            replyTo: email, 
            subject: `🚀 رسالة تواصل جديدة من: ${name}`, 
            html: `
                <div dir="rtl" style="font-family: Arial; padding: 20px; border: 1px solid #3b82f6; border-radius: 10px;">
                    <h2 style="color: #3b82f6;">رسالة تواصل جديدة!</h2>
                    <p><strong>المرسل:</strong> ${name}</p>
                    <p><strong>البريد:</strong> ${email}</p>
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin-top: 10px;">
                        ${message}
                    </div>
                </div>`
        });
        res.json({ success: true });
    } catch (error) { 
        console.error("❌ Contact Error:", error.message);
        res.status(500).json({ success: false }); 
    }
});

app.post('/api/visit', async (req, res) => {
    try {
        let visitInfo = await Visit.findOneAndUpdate(
            { id: "main_counter" },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
        );
        res.json({ success: true, count: visitInfo.count });
    } catch (error) { res.status(500).json({ success: false }); }
});

// --- APIs الأدمن المحمية ---
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