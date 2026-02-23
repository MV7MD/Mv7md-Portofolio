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
            headers: { 'accept': 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
            body: JSON.stringify(body)
        });
        return response.ok;
    } catch (error) { return false; }
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
        const htmlContent = `<div dir="rtl" style="font-family: Arial; padding: 20px; border: 1px solid #2563eb; border-radius: 12px;"><h2>📩 رسالة جديدة</h2><p><strong>الاسم:</strong> ${name}</p><p><strong>الرسالة:</strong> ${message}</p></div>`;
        await sendEmailViaBrevo(`🚀 تواصل جديد: ${name}`, htmlContent, email);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/reviews', async (req, res) => {
    const { reviewerName, message, rating } = req.body;
    try {
        const newReview = new Review({ reviewerName, message, rating });
        await newReview.save();
        const htmlContent = `<div dir="rtl" style="font-family: Arial; padding: 20px; border: 1px solid #fbbf24; border-radius: 12px;"><h2>🌟 تقييم جديد</h2><p><strong>الاسم:</strong> ${reviewerName}</p><p><strong>التقييم:</strong> ${rating} نجوم</p></div>`;
        await sendEmailViaBrevo(`⭐ تقييم جديد: ${reviewerName}`, htmlContent);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

// --- جلب البيانات المعروضة (للموقع) ---
app.get('/api/projects/home', async (req, res) => {
    // جلب المثبت في الهوم
    const projects = await Project.find({ showOnHome: true }).limit(2).sort({ createdAt: -1 });
    res.json(projects);
});

app.get('/api/reviews/home', async (req, res) => {
    // جلب المثبت في الهوم
    const reviews = await Review.find({ showOnHome: true }).limit(2).sort({ createdAt: -1 });
    res.json(reviews);
});

// جلب الكل للزوار (الصفحات الفرعية)
app.get('/api/projects', async (req, res) => {
    const projects = await Project.find({ isVisible: true }).sort({ createdAt: -1 });
    res.json(projects);
});

app.get('/api/reviews', async (req, res) => {
    const reviews = await Review.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json(reviews);
});

// مسار تسجيل الزيارات
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

// --- 🛠️ إدارة الأدمن ---

app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    const visitInfo = await Visit.findOne({ id: "main_counter" });
    res.json({ visits: visitInfo ? visitInfo.count : 0 });
});

app.get('/api/admin/reviews', verifyAdmin, async (req, res) => {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
});

app.get('/api/admin/projects', verifyAdmin, async (req, res) => {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
});

app.put('/api/admin/reviews/:id/approve', verifyAdmin, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        review.isApproved = !review.isApproved;
        await review.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.put('/api/admin/reviews/:id/home', verifyAdmin, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        review.showOnHome = !review.showOnHome;
        await review.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.put('/api/admin/projects/:id/home', verifyAdmin, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        project.showOnHome = !project.showOnHome;
        await project.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.put('/api/admin/projects/:id/visibility', verifyAdmin, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        project.isVisible = !project.isVisible;
        await project.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/reviews/:id', verifyAdmin, async (req, res) => {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Front End', 'main-page', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));