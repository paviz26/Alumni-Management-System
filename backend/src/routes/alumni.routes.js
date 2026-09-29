const router = require("express").Router();

// TODO: Implement alumni endpoints.

router.get("/", (req, res) => {
  res.json({ message: "alumni API endpoint" });
});

module.exports = router;
