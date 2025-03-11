const express = require("express");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS & JSON Parsing
app.use(cors());
app.use(express.json());

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.on("qr", (qr) => {
    console.log("Scan this QR Code:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("WhatsApp Bot is ready!");
});

client.initialize();

// ✅ 1. Send Text Message to One Person
app.post("/send-message", async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ success: false, error: "Phone and message required" });

    try {
        await client.sendMessage(phone + "@c.us", message);
        res.json({ success: true, message: "Message sent!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.toString() });
    }
});

// ✅ 2. Send Image/PDF to One Person
app.post("/send-media", async (req, res) => {
    const { phone, fileUrl, caption } = req.body;
    if (!phone || !fileUrl) return res.status(400).json({ success: false, error: "Phone and fileUrl required" });

    try {
        const media = await MessageMedia.fromUrl(fileUrl);
        await client.sendMessage(phone + "@c.us", media, { caption: caption || "" });
        res.json({ success: true, message: "Media sent!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.toString() });
    }
});

// ✅ 3. Send Text Message to Multiple People
app.post("/send-multiple-text", async (req, res) => {
    const { phones, message } = req.body;
    if (!phones || !message) return res.status(400).json({ success: false, error: "Phones and message required" });

    try {
        for (let phone of phones) {
            await client.sendMessage(phone + "@c.us", message);
        }
        res.json({ success: true, message: "Messages sent!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.toString() });
    }
});

// ✅ 4. Send Image/PDF to Multiple People
app.post("/send-multiple-media", async (req, res) => {
    const { phones, fileUrl, caption } = req.body;
    if (!phones || !fileUrl) return res.status(400).json({ success: false, error: "Phones and fileUrl required" });

    try {
        const media = await MessageMedia.fromUrl(fileUrl);
        for (let phone of phones) {
            await client.sendMessage(phone + "@c.us", media, { caption: caption || "" });
        }
        res.json({ success: true, message: "Media messages sent!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.toString() });
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
