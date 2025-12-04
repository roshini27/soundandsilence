// Website Analytics Event Sending

// Helper: Get accurate UTC timestamp from the internet
async function getAccurateUTCTimestamp() {
    try {
        const response = await fetch('https://www.timeapi.io/api/Time/current/zone?timeZone=UTC');
        const data = await response.json();
        return data.dateTime; // e.g., "2024-06-07T12:34:56.789Z"
    } catch (err) {
        // Fallback to device time if API fails
        console.error('Failed to fetch internet time, using device time.', err);
        return new Date().toISOString();
    }
}

// Generate a random userId for the session
function generateRandomUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Store the random userId in sessionStorage so it persists for the session
let analyticsUserId = sessionStorage.getItem('analyticsUserId');
if (!analyticsUserId) {
    analyticsUserId = generateRandomUserId();
    sessionStorage.setItem('analyticsUserId', analyticsUserId);
}

// Smooth scrolling for navigation links and analytics for nav clicks
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', async function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
        // --- Analytics: Send click event ---
        const timestamp = await getAccurateUTCTimestamp();
        fetch('https://analytics.soundandsilence.in/sendevent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: 'navClick',
                userId: analyticsUserId,
                link: this.getAttribute('href'),
                timestamp: timestamp
            })
        }).catch(err => console.error('Analytics error:', err));
    });
});

// Navbar background change on scroll and analytics for scroll event
let scrollEventSent = false;
window.addEventListener('scroll', async function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
    // --- Analytics: Send scroll event once per session ---
    if (!scrollEventSent && window.scrollY > 50) {
        scrollEventSent = true;
        const timestamp = await getAccurateUTCTimestamp();
        fetch('https://analytics.soundandsilence.in/sendevent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: 'scrolledPast50px',
                userId: analyticsUserId,
                scrollY: window.scrollY,
                timestamp: timestamp
            })
        }).catch(err => console.error('Analytics error:', err));
    }
});

// Form submission handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('.submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        try {
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                location: document.getElementById('location').value,
                message: document.getElementById('message').value
            };

            const response = await fetch('/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
            } else {
                throw new Error(result.message);
            }

            // --- Analytics: Send form submission event ---
            const timestamp = await getAccurateUTCTimestamp();
            fetch('https://analytics.soundandsilence.in/sendevent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventName: 'formSubmit',
                    userId: analyticsUserId,
                    timestamp: timestamp
                })
            }).catch(err => console.error('Analytics error:', err));

        } catch (error) {
            alert('Sorry, there was an error sending your message. Please try again later.');
            console.error('Error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        }
    });
}

// Animate service cards on scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease';
    observer.observe(card);
});

// --- Analytics: Send page view event on page load ---
getAccurateUTCTimestamp().then(timestamp => {
    fetch('https://analytics.soundandsilence.in/sendevent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            eventName: 'pageView',
            userId: analyticsUserId,
            timestamp: timestamp
        })
    })
    .then(res => res.json())
    .then(data => console.log('Analytics response:', data))
    .catch(err => console.error('Analytics error:', err));
}); 
