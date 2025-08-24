import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Chat from "../models/chat.js";

// generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// api to register user
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.json({ success: false, message: "User already exists" });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        return res.json({ success: true, message: "User registered successfully", token, user });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// api to login user
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password)

            if (isMatch) {
                const token = generateToken(user._id);
                return res.json({ success: true, message: "User logged in successfully", token, user });
            }
        }
        return res.json({ success: false, message: "Invalid email or password" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// api to get user
export const getUser = async (req, res) => {
    try {
        const user = req.user;
        return res.json({ success: true, message: "User fetched successfully", user });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}


// api to get published images
export const getPublishedImages = async (req, res) => {
    try {
        const publishedImages = await Chat.aggregate([
            {$unwind: "$messages"},
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true
                }
            },
            {
                $project: {
                    _id: 0,
                    content: "$messages.content",
                    userName: "$userName"
                }
            },

        ])
        res.json({ success: true, message: "Published images fetched successfully", images: publishedImages.reverse() })
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}