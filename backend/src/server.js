require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Alumni Management API is running" });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/alumni", require("./routes/alumni.routes"));
app.use("/api/events", require("./routes/events.routes"));
app.use("/api/jobs", require("./routes/jobs.routes"));
app.use("/api/mentorship", require("./routes/mentorship.routes"));
app.use("/api/announcements", require("./routes/announcements.routes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
