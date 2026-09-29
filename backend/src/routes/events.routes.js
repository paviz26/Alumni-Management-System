const router = require("express").Router();

// TODO: Implement events endpoints.

router.get("/", (req, res) => {
  res.json({ message: "events API endpoint" });
});

module.exports = router;
