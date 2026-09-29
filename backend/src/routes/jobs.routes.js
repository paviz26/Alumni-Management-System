const router = require("express").Router();

// TODO: Implement jobs endpoints.

router.get("/", (req, res) => {
  res.json({ message: "jobs API endpoint" });
});

module.exports = router;
