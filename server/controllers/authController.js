const User = require("../models/users");
const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../services/authService");

const JWT_SECRET = process.env.JWT_SECRET;


const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await hashPassword(password);

    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      token,
      user: { id: user._id, name, email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const dashboard = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  return res.json({
    message: `Welcome ${user.name}`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      history: user.history,
    },
  });
};

module.exports = { register, login, dashboard };
