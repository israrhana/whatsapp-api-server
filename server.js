const express = require("express");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS & JSON Parsing
app.use(cors());
app.use(express.json());

// Initialize WhatsApp Client with better settings

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,  // Show the browser to debug issues
        executablePath: require("puppeteer").executablePath(),  // Use full Puppeteer
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu"
        ]
    }
});




// QR Code Event
client.on("qr", (qr) => {
    console.log("🔹 Scan this QR Code:");
    qrcode.generate(qr, { small: true });
});

// Ready Event
client.on("ready", async () => {
    console.log("✅ WhatsApp Bot is ready!");

    // Ensure WhatsApp Web is fully loaded before sending messages
    setTimeout(() => {
        console.log("🔄 Ensuring WhatsApp Web is fully loaded...");
    }, 5000);
});


client.on("authenticated", () => {
    console.log("🔹 Successfully authenticated.");
});

client.on("disconnected", (reason) => {
    console.log("⚠️ WhatsApp disconnected! Reason:", reason);
});

client.initialize();

// ✅ Utility Function to Check Client Readiness
const ensureClientReady = (res) => {
    if (!client.info) {
        return res.status(500).json({ success: false, error: "WhatsApp Web is not ready yet. Please wait and try again." });
    }
};

// ✅ 1. Send Text Message to One Person
app.post("/send-message", async (req, res) => {
    ensureClientReady(res);
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ success: false, error: "Phone and message required" });

    try {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay to avoid Puppeteer issues
        await client.sendMessage(phone + "@c.us", message);
        res.json({ success: true, message: `Message sent to ${phone}!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || error.toString() });
    }
});

// ✅ 2. Send Image/PDF to One Person
app.post("/send-media", async (req, res) => {
    const { phone, fileUrl, caption } = req.body;
    if (!phone || !fileUrl) return res.status(400).json({ success: false, error: "Phone and fileUrl required" });

    try {
        console.log("📸 Fetching media from URL:", fileUrl);
        const media = await MessageMedia.fromUrl(fileUrl);
        console.log("✅ Media fetched successfully");

        await client.sendMessage(phone + "@c.us", media, { caption: caption || "" });
        res.json({ success: true, message: "Media sent!" });
    } catch (error) {
        console.error("❌ Error fetching/sending media:", error);
        res.status(500).json({ success: false, error: error.toString() });
    }
});


// ✅ 3. Send Text Message to Multiple People (Bulk Messaging)
app.post("/send-multiple-text", async (req, res) => {
    ensureClientReady(res);
    const { phones, message } = req.body;
    if (!phones || !message) return res.status(400).json({ success: false, error: "Phones and message required" });

    try {
        for (let phone of phones) {
            await client.sendMessage(phone + "@c.us", message);
            await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay to avoid spam detection
        }
        res.json({ success: true, message: "Messages sent successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || error.toString() });
    }
});

// ✅ 4. Send Image/PDF to Multiple People
app.post("/send-multiple-media", async (req, res) => {
    ensureClientReady(res);
    const { phones, fileUrl, caption } = req.body;
    if (!phones || !fileUrl) return res.status(400).json({ success: false, error: "Phones and fileUrl required" });

    try {
        const media = await MessageMedia.fromUrl(fileUrl); // Load media once to optimize performance
        for (let phone of phones) {
            await client.sendMessage(phone + "@c.us", media, { caption: caption || "" });
            await new Promise((resolve) => setTimeout(resolve, 500)); // Delay to prevent WhatsApp spam detection
        }
        res.json({ success: true, message: "Media messages sent successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || error.toString() });
    }
});

// ✅ 5. Health Check Endpoint
app.get("/", (req, res) => {
    res.send("WhatsApp API Server is running!");
});

// ✅ Start Express Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


