const express = require('express');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Error handling - catch unhandled errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// CORS Middleware - MUST be first, handles all requests
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Set CORS headers for all requests
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Max-Age', '3600');
    
    // Handle OPTIONS preflight requests immediately
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (optional - only if you have public files)
try {
    if (fs.existsSync('./public')) {
        app.use(express.static('public'));
    }
} catch (error) {
    // Ignore if static files not needed
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = '1197255819';

// Analytics endpoint - /sendevent
app.post('/sendevent', async (req, res) => {
    try {
        const eventData = req.body;
        console.log('Analytics event received:', eventData);
        
        res.json({
            status: 'success',
            message: 'Event received',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error processing analytics event:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Form submission endpoint
app.post('/submit-form', async (req, res) => {
    try {
        const { name, email, phone, location, message } = req.body;
        
        if (!TELEGRAM_BOT_TOKEN) {
            console.warn('TELEGRAM_BOT_TOKEN not set - form submission logged only');
            return res.json({ success: true, message: 'Form received (Telegram not configured)' });
        }
        
        const telegramMessage = `
🔔 New Contact Form Submission

👤 Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone}
📍 Location: ${location}
💬 Message: ${message}
        `;

        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: telegramMessage,
            parse_mode: 'HTML'
        });

        if (response.data.ok) {
            res.json({ success: true, message: 'Form submitted successfully!' });
        } else {
            throw new Error('Failed to send Telegram message');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error submitting form' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found'
    });
});

const PORT = process.env.PORT || 3000;

// Start server
try {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`✅ CORS enabled for all origins`);
        console.log(`✅ Health check: http://localhost:${PORT}/health`);
    });
} catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
}
