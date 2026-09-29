const router = require("express").Router();

// TODO: Implement announcements endpoints.

router.get("/", (req, res) => {
  res.json({ message: "announcements API endpoint" });
});

module.exports = router;
