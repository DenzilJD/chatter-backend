const asyncHandler = require('express-async-handler');
const User = require('../Models/userModel');
const generateToken = require('../Config/generateToken');

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, pass, pic } = req.body;
    if (!name || !email || !pass) {
        res.status(400).send({
            message: "Please enter all the fields."
        });
        throw new Error("Please enter all the fields.");
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400).send({
            message: "User already exists!"
        });
        throw new Error("User already exists!");
    }
    const user = await User.create({ name, email, pass, pic });
    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pass: user.pass,
            pic: user.pic,
            token: generateToken(user._id)
        });
    }
    else {
        res.status(400);
        throw new Error("Registration failed!");
    }
});

const authUser = asyncHandler(async (req, res) => {
    const { email, pass } = req.body;
    console.log('Login request.');
    const user = await User.findOne({ email });
    if (user && (await user.matchPass(pass))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id)
        });
    }
    else if (user) {
        res.status(401).send({
            message: "Incorrect password!"
        });
        throw new Error("Incorrect password!");
    }
    else {
        res.status(401).send({
            message: "No such user exists! Please Sign Up, first."
        });
        throw new Error("No such user exists! Please Sign Up, first.");
    }
});

const allUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.search ? {
        $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } }
        ]
    } : {};
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users.map(temp => {
        temp.pass = '';
        return temp;
    }));
});

module.exports = { registerUser, authUser, allUsers };