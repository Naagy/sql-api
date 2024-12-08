const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();
const PORT = 3000;

app.use(express.json());

const db = new sqlite3.Database(":memory:");

db.serialize(() => {
  db.run(
    `CREATE TABLE users (
      email TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      class TEXT
    )`
  );
});

app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get("/users/:email", (req, res) => {
  const { email } = req.params;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(row);
  });
});

app.post("/users", (req, res) => {
  const { email, firstName, lastName, class: userClass } = req.body;

  if (!email || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sql = "INSERT INTO users (email, firstName, lastName, class) VALUES (?, ?, ?, ?)";
  db.run(sql, [email, firstName, lastName, userClass], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "User created" });
  });
});

app.put("/users/:email", (req, res) => {
  const { email } = req.params;
  const { firstName, lastName, class: userClass } = req.body;

  const sql = `
    UPDATE users 
    SET firstName = ?, lastName = ?, class = ?
    WHERE email = ?
  `;
  db.run(sql, [firstName, lastName, userClass, email], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User updated" });
  });
});

app.delete("/users/:email", (req, res) => {
  const { email } = req.params;

  const sql = "DELETE FROM users WHERE email = ?";
  db.run(sql, [email], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted" });
  });
});

console.log("Server is starting...");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
