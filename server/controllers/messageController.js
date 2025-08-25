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

        // Check if ImageKit environment variables are configured
        if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
            return res.json({ 
                success: false, 
                message: "Image generation service is not properly configured. Please contact support." 
            });
        }

        // Use ImageKit AI generation API properly
        let aiImageResponse;
        try {
            // Try using ImageKit AI API first
            const generationResponse = await imagekit.createAIImage({
                prompt: prompt,
                width: 800,
                height: 800,
                aspectRatio: "1:1"
            });
            
            // Get the generated image URL
            const generatedImageUrl = generationResponse.url;
            
            // Download the generated image
            aiImageResponse = await axios.get(generatedImageUrl, {responseType: 'arraybuffer'});
            
        } catch (imageError) {
            console.error('ImageKit AI Generation Error:', imageError.response?.status, imageError.response?.data);
            
            // Fallback to URL-based generation if AI API fails
            try {
                const encodedPrompt = encodeURIComponent(prompt);
                const fallbackUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;
                
                aiImageResponse = await axios.get(fallbackUrl, {responseType: 'arraybuffer'});
            } catch (fallbackError) {
                console.error('Fallback generation also failed:', fallbackError.response?.status);
                
                if (imageError.response?.status === 403 || fallbackError.response?.status === 403) {
                    return res.json({ 
                        success: false, 
                        message: "Image generation service is currently unavailable. Please check your ImageKit AI credits and try again." 
                    });
                }
                
                return res.json({ 
                    success: false, 
                    message: "Failed to generate image. Please try again." 
                });
            }
        }

        // convert to base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString("base64")}`;

        let uploadResponse;
        try {
            // Upload to imagekit media Library
            uploadResponse = await imagekit.upload({
                file: base64Image,
                fileName: `${Date.now()}.png`,
                folder: "quickgpt"
            });
        } catch (uploadError) {
            console.error('ImageKit Upload Error:', uploadError);
            return res.json({ 
                success: false, 
                message: "Failed to save generated image. Please try again." 
            });
        }

        const reply = {
            role: "assistant",
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished,
            imageUrl: `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString("base64")}`
        }
        res.json({ success: true, message: "Message sent successfully", reply })
        chat.messages.push(reply)
        await chat.save()

        await User.updateOne({_id: userId}, {$inc: {credits: -2}})


    } catch (error) {
        console.error('Image generation error:', error);
        res.json({ success: false, message: error.message })
    }
}
