const asyncHandler = require("express-async-handler");
const { Error } = require("mongoose");
const User = require("../Models/userModel");
const Chat = require("../Models/chatModel");

const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId)
        return res.sendStatus(400);
    let isChat = await Chat.find({
        isGroup: false,
        $and: [{ users: { $elemMatch: { $eq: userId } } },
        { users: { $elemMatch: { $eq: req.user._id } } }]
    }).populate("users", "-pass")
        .populate("latestMessage");
    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name email pic"
    });
    if (isChat.length > 0)
        res.send(isChat[0]);
    else {
        isChat = {
            chatName: 'sender',
            isGroup: false,
            users: [userId, req.user._id]
        };
        try {
            const createdChat = await Chat.create(isChat);
            const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-pass");
            res.status(200).send(fullChat);
        }
        catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});
const fetchChat = asyncHandler(async (req, res) => {
    try {
        Chat.find({
            users: { $elemMatch: { $eq: req.user._id } }
        }).populate("users", "-pass")
            .populate("groupAdmin")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name email pic"
                });
                res.status(200).send(results);
            })
    }
    catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});
const createGroupChat = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name)
        return res.status(400).send({
            message: "Please send all the fields."
        });
    let users = JSON.parse(req.body.users);
    if (users.length < 2) {
        return res.status(400).send({
            message: "Select atleast 2 contacts (excluding yourself) to create a Group."
        });
    }
    users.push(req.user);
    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroup: true,
            groupAdmin: req.user
        });
        const fullChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-pass")
            .populate("groupAdmin", "-pass");
        res.status(200).json(fullChat);
    }
    catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});
const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;
    const group = await Chat.findbyIdAndUpdate(chatId, {
        chatName
    }, {
        new: true
    })
        .populate("users", "-pass")
        .populate("groupAdmin", "-pass");
    if (!group) {
        res.status(404);
        throw new Error("Chat not found!");
    }
    else {
        res.json(group);
    }
});
const removeFromGroup = asyncHandler(async (req, res) => {
    const { userId, chatId } = req.body;
    const group = await Chat.findbyIdAndUpdate(chatId, {
        $pull: { users: userId }
    }, {
        new: true
    })
        .populate("users", "-pass")
        .populate("groupAdmin", "-pass");
    if (!group) {
        res.status(404);
        throw new Error("Chat not found!");
    }
    else {
        res.json(group);
    }
});
const addToGroup = asyncHandler(async (req, res) => {
    const { userId, chatId } = req.body;
    const group = await Chat.findbyIdAndUpdate(chatId, {
        $push: { users: userId }
    }, {
        new: true
    })
        .populate("users", "-pass")
        .populate("groupAdmin", "-pass");
    if (!group) {
        res.status(404);
        throw new Error("Chat not found!");
    }
    else {
        res.json(group);
    }
});

module.exports = { accessChat, fetchChat, createGroupChat, renameGroup, removeFromGroup, addToGroup };