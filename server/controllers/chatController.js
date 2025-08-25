import Chat from "../models/chat.js"

// api for creating a chat
export const createChat = async (req, res) => {
    try {
        const userId = req.user._id

        const chatData = {
            userId,
            messages: [],
            name: "New Chat",
            userName: req.user.name
        }
        const newChat = await Chat.create(chatData)
        return res.json({ 
            success: true, 
            message: "Chat created successfully",
            chat: newChat
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// api for getting all chats
export const getChats = async (req, res) => {
    try {
        const userId = req.user._id
        const chats = await Chat.find({ userId }).sort({ upadtedAt: -1 })
        return res.json({ success: true, message: "Chats fetched successfully", chats })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// delete chat
export const deleteChat = async (req, res) => {
    try {
        const userId = req.user._id
        const { chatId } = req.body
        await Chat.deleteOne({_id: chatId, userId})
        return res.json({ success: true, message: "Chat deleted successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}