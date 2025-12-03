const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Manual CORS middleware - ensures headers are always set
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow all origins (for development/testing)
    // In production, replace '*' with specific domains
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Max-Age', '3600');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

app.use(express.json());
app.use(express.static('.'));

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
const TELEGRAM_CHAT_ID = '1197255819'; // Your Telegram chat ID

// Analytics endpoint - /sendevent (for your script.js)
app.post('/sendevent', async (req, res) => {
    try {
        const eventData = req.body;
        
        // Process your analytics event here
        console.log('Analytics event received:', eventData);
        
        // Return success response
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

// Handle form submission
app.post('/submit-form', async (req, res) => {
    // CORS headers already set by middleware above
    try {
        const { name, email, phone, location, message } = req.body;
        
        // Create message for Telegram
        const telegramMessage = `
🔔 New Contact Form Submission

👤 Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone}
📍 Location: ${location}
💬 Message: ${message}
        `;

        // Send to Telegram
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS enabled for soundandsilence.in domains`);
});
