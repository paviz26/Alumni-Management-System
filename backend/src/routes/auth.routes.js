const router = require("express").Router();

// TODO: Implement auth endpoints.

router.get("/", (req, res) => {
  res.json({ message: "auth API endpoint" });
});

module.exports = router;
