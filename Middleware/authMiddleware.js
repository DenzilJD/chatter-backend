const jwt = require("jsonwebtoken");
const User = require('../Models/userModel');
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-pass");
            next();
        }
        catch (error) {
            res.status(401).send({
                message: "Not authorised! The token provided is not valid."
            });
        }
    }
    else {
        res.status(401).send({
            message: "Not authorised! No token provided."
        });
    }
});

module.exports = { protect };