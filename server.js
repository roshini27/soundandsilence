const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = '9000380017'; // Your Telegram chat ID

// Handle form submission
app.post('/submit-form', async (req, res) => {
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
}); 