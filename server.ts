import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite Database
const db = new Database("balaghoh.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS dictionary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term_ar TEXT NOT NULL,
    term_id TEXT NOT NULL,
    definition TEXT NOT NULL,
    category TEXT NOT NULL
  )
`);

// Seed some data if empty
const count = db.prepare("SELECT count(*) as count FROM dictionary").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO dictionary (term_ar, term_id, definition, category) VALUES (?, ?, ?, ?)");
  insert.run("التشبيه", "Tashbih", "Menyerupakan sesuatu dengan sesuatu yang lain karena adanya kesamaan sifat.", "Bayan");
  insert.run("الاستعارة", "Isti'arah", "Pemakaian kata bukan pada makna aslinya karena adanya hubungan keserupaan.", "Bayan");
  insert.run("الكناية", "Kinayah", "Ungkapan yang maknanya bukan makna leksikal, melainkan makna yang menyertainya.", "Bayan");
  insert.run("الطباق", "Thibaq", "Berkumpulnya dua kata yang berlawanan makna dalam satu kalimat.", "Badi'");
  insert.run("الجناس", "Jinas", "Dua kata yang sama atau mirip bunyinya tetapi berbeda maknanya.", "Badi'");
}

// Groq Client
let groq: Groq | null = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// API Routes
app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Query is required" });
  }

  // 1. Search in local DB
  const localResults = db.prepare(`
    SELECT * FROM dictionary 
    WHERE term_ar LIKE ? OR term_id LIKE ? OR definition LIKE ?
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);

  if (localResults.length > 0) {
    return res.json({ source: "local", results: localResults });
  }

  // 2. If not found, use Groq if available
  if (!groq) {
    return res.json({ 
      source: "local", 
      results: [], 
      message: "Term not found in local database and Groq API Key is not configured." 
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Anda adalah pakar sastra Arab (Balaghoh). Berikan definisi singkat dan jelas dalam Bahasa Indonesia untuk istilah Balaghoh yang ditanyakan. Sertakan istilah Arabnya, kategori (Bayan/Ma'ani/Badi'), dan contoh singkat."
        },
        {
          role: "user",
          content: `Jelaskan istilah Balaghoh: ${q}`
        }
      ],
      model: "llama-3.3-70b-versatile",
    });

    const aiResponse = completion.choices[0]?.message?.content || "Tidak ada penjelasan ditemukan.";
    return res.json({ source: "ai", content: aiResponse });
  } catch (error: any) {
    console.error("Groq Error:", error);
    return res.status(500).json({ error: "Failed to fetch from AI" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
