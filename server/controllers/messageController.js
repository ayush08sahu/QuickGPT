import axios from "axios"
import Chat from "../models/chat.js"
import User from "../models/User.js"
import imagekit from "../config/imagekit.js"
import openai from "../config/openai.js"

// text-base AI chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id

        // check credits
        if (req.user.credits < 1) {
            return res.json({success: false, message: "You don't have enough credits to use this feature"})
        }

        const { chatId, prompt } = req.body

        const chat = await Chat.findOne({ userId, _id: chatId })
        chat.messages.push({role: "user", content: prompt, timestamp: Date.now(), isImage: false})


    const { choices } = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
        {
            role: "user",
            content: prompt,
        },
    ],
});

const reply = {...choices[0].message, timestamp: Date.now(), isImage: false}
res.json({ success: true, message: "Message sent successfully", reply })
chat.messages.push(reply)
await chat.save()


await User.updateOne({_id: userId}, {$inc: {credits: -1}})


    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// image Generation Message Controller
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        // check credits
        if (req.user.credits < 2) {
            return res.json({success: false, message: "You don't have enough credits to use this feature"})
        }
        const  {prompt, chatId, isPublished} = req.body
        // find chat
        const chat = await Chat.findOne({userId, _id: chatId})

        // Push user message
        chat.messages.push({role: "user", content: prompt, timestamp: Date.now(), isImage: false})

        // Encode the prompt
        const encodedPrompt = encodeURIComponent(prompt)

        // Construct imagekit AI generation URL
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;

        // Trigger generation by fetching from Imagekit
        const aiImageResponse = await axios.get(generatedImageUrl, {responseType: 'arraybuffer'});

        // convert to base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString("base64")}`;

        // Upload to imageki media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "quickgpt"
        })

        const reply = {
            role: "assistant",
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished
        }
        res.json({ success: true, message: "Message sent successfully", reply })
        chat.messages.push(reply)
        await chat.save()

        await User.updateOne({_id: userId}, {$inc: {credits: -2}})


    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
