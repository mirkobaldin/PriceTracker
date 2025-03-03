import express from 'express';
import { Stripe } from 'stripe';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET);

// Middleware avanzati
app.use(helmet());
app.use(express.json());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 100 // Limite richieste
}));

// API Key Authentication Middleware
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Non autorizzato' });
    }
    next();
};

// Endpoint tracking prodotti
app.post('/api/track', apiKeyAuth, async (req, res) => {
    try {
        const { url, userId } = req.body;
        
        // Verifica limite piano utente
        const user = await db.get(
            'SELECT plan, product_count FROM users WHERE id = ?',
            [userId]
        );
        
        const planLimits = {
            basic: 1,
            pro: 10,
            premium: Infinity,
            elite: Infinity
        };

        if (user.product_count >= planLimits[user.plan]) {
            return res.status(402).json({ error: 'Limite piano raggiunto' });
        }

        // Scraping avanzato con rotazione User-Agent
        const price = await advancedScraper(url);
        
        // Aggiorna database
        await db.run(
            'INSERT INTO products (url, price, userId) VALUES (?, ?, ?)',
            [url, price, userId]
        );

        res.json({ 
            currentPrice: price,
            history: await getPriceHistory(url) 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stripe Webhook Handler
app.post('/stripe-webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestione eventi
    switch (event.type) {
        case 'checkout.session.completed':
            handleSubscriptionUpdate(event.data.object);
            break;
        // Aggiungi altri casi...
    }

    res.json({received: true});
});

async function advancedScraper(url) {
    // Implementa:
    // - Rotazione IP con proxy gratuiti
    // - User-Agent casuali
    // - Rendering JS con Puppeteer
    // - Cache risultati
}