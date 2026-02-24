require('dotenv').config(); 


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


mongoose.connect(process.env.DB_URI)
    .then(() => console.log('✅✅✅ تم الربط بالسحاب بنجاح!'))
    .catch((err) => console.error('❌ فشل الاتصال بالسحاب:', err.message));


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


app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        const htmlContent = `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-top: 6px solid #2563eb;">
                <div style="padding: 30px; border-bottom: 1px solid #f1f5f9; text-align: right;">
                    <h2 style="margin: 0; color: #2563eb; font-size: 24px; display: flex; align-items: center;">
                        <span style="margin-left: 10px;">📩</span> رسالة تواصل جديدة
                    </h2>
                    <p style="color: #64748b; font-size: 15px; margin-top: 8px; margin-bottom: 0;">لديك استفسار جديد من زوار معرض أعمالك.</p>
                </div>
                <div style="padding: 30px; text-align: right;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px dashed #e2e8f0; font-size: 16px;">
                                <strong style="color: #334155;">👤 المرسل:</strong> ${name}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px dashed #e2e8f0; font-size: 16px;">
                                <strong style="color: #334155;">📧 البريد الإلكتروني:</strong> 
                                <a href="mailto:${email}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${email}</a>
                            </td>
                        </tr>
                    </table>
                    <div style="margin-top: 30px; background-color: #f1f5f9; padding: 25px; border-radius: 12px; border-right: 4px solid #3b82f6;">
                        <h4 style="margin: 0 0 10px 0; color: #475569; font-size: 16px;">📝 محتوى الرسالة:</h4>
                        <p style="margin: 0; color: #1e293b; font-size: 16px; white-space: pre-wrap;">${message}</p>
                    </div>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                    هذه الرسالة مُرسلة تلقائياً من نظام الإشعارات بموقعك الشخصي.<br>
                    يمكنك الرد مباشرة على هذا الإيميل وسيصل للمرسل.
                </div>
            </div>
        </div>`;

        await sendEmailViaBrevo(`🚀 تواصل جديد: ${name}`, htmlContent, email);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});


app.post('/api/reviews', async (req, res) => {
    const { reviewerName, message, rating } = req.body;
    try {
        const newReview = new Review({ reviewerName, message, rating });
        await newReview.save();
        
        const starsHtml = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
        
        const htmlContent = `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; background-color: #fdfce8; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-top: 6px solid #fbbf24;">
                <div style="padding: 30px; text-align: center; background: linear-gradient(to bottom, #fffbeb, #ffffff); border-bottom: 1px solid #fef3c7;">
                    <div style="font-size: 45px; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);">🌟</div>
                    <h2 style="margin: 0; color: #d97706; font-size: 24px;">تقييم جديد بانتظار الموافقة!</h2>
                    <p style="color: #78716c; font-size: 15px; margin-top: 8px; margin-bottom: 0;">شخص ما قام بتقييم أعمالك للتو.</p>
                </div>
                <div style="padding: 30px; text-align: right;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 35px; letter-spacing: 4px; color: #fbbf24;">${starsHtml}</div>
                        <div style="margin-top: 10px;">
                            <span style="background-color: #fef3c7; color: #b45309; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">تقييم ${rating} من 5</span>
                        </div>
                    </div>
                    <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; padding: 25px; border-radius: 16px; position: relative;">
                        <p style="margin: 0 0 15px 0; color: #57534e; font-size: 16px;">
                            <strong style="color: #44403c;">👤 بواسطة:</strong> ${reviewerName}
                        </p>
                        <hr style="border: 0; border-top: 1px dashed #d6d3d1; margin: 0 0 15px 0;">
                        <p style="margin: 0; color: #292524; font-style: italic; font-size: 18px; text-align: center; font-weight: bold;">
                            "${message}"
                        </p>
                    </div>
                </div>
                <div style="background-color: #fffbeb; padding: 20px; text-align: center; font-size: 14px; color: #b45309; border-top: 1px solid #fef3c7;">
                    🚀 يرجى الدخول إلى <strong>لوحة التحكم (Dashboard)</strong> للموافقة على عرض هذا التقييم في موقعك.
                </div>
            </div>
        </div>`;

        await sendEmailViaBrevo(`⭐ تقييم جديد: ${reviewerName}`, htmlContent);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});


app.get('/api/projects/home', async (req, res) => {
    
    const projects = await Project.find({ showOnHome: true }).limit(2).sort({ createdAt: -1 });
    res.json(projects);
});

app.get('/api/reviews/home', async (req, res) => {

    const reviews = await Review.find({ showOnHome: true }).limit(2).sort({ createdAt: -1 });
    res.json(reviews);
});


app.get('/api/projects', async (req, res) => {
    const projects = await Project.find({ isVisible: true }).sort({ createdAt: -1 });
    res.json(projects);
});

app.get('/api/reviews', async (req, res) => {
    const reviews = await Review.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json(reviews);
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