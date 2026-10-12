const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const db = new sqlite3.Database("./database.db");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));


// The second block creates the correct full table:
db.run(`CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  manufacturer TEXT,
  model TEXT,
  quantity INTEGER,
  location TEXT,
  description TEXT
)`);
// Get all items
app.get("/api/items", (req, res) => {
  db.all("SELECT * FROM inventory", [], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// Add item
app.post("/api/items", (req, res) => {
  const { name, manufacturer, model, quantity, location, description } = req.body;
  db.run(`INSERT INTO inventory (name, manufacturer, model, quantity, location, description)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [name, manufacturer, model, quantity, location, description],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ id: this.lastID });
    });
});


// Delete item
app.delete("/api/items/:id", (req, res) => {
    db.run("DELETE FROM inventory WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json(err);
        res.sendStatus(200);
    });
});

// Update item
app.put("/api/items/:id", (req, res) => {
  const { name, manufacturer, model, quantity, location, description } = req.body;
  db.run(`UPDATE inventory SET name = ?, manufacturer = ?, model = ?, quantity = ?, location = ?, description = ? WHERE id = ?`,
    [name, manufacturer, model, quantity, location, description, req.params.id],
    function (err) {
      if (err) return res.status(500).json(err);
      res.sendStatus(200);
    });
});

// Health check, so the host can tell a live container from a dead one
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Hosts assign the port through PORT. Fall back to 3000 for local work.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
