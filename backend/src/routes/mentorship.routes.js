const router = require("express").Router();

// TODO: Implement mentorship endpoints.

router.get("/", (req, res) => {
  res.json({ message: "mentorship API endpoint" });
});

module.exports = router;
