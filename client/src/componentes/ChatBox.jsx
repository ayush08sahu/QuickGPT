import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import Loading from "./../pages/Loading";
import { assets } from "../assets/assets";
import Message from "./Message";
import toast from "react-hot-toast";

const ChatBox = () => {

  const containerRef = useRef(null);

  const { selectedChat, theme, user, axios, token, setUser, setSelectedChat, setChats, updateChat, setIsChatting } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text");
  const [isPublished, setIsPublished] = useState(false);

  const onSubmit = async (e) => {
    // Prevent any default form behavior
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return toast('Login to send message');
    if (!prompt.trim()) return toast('Please enter a message');
    if (!selectedChat?._id) return toast('No chat selected');
    
    const promptCopy = prompt.trim();
    setPrompt('');
    setLoading(true);
    setIsChatting(true);
    
    // Store current chat ID to prevent race conditions
    const currentChatId = selectedChat._id;
    
    // Create user message with unique timestamp
    const userMessage = {
      role: 'user',
      content: promptCopy,
      timestamp: Date.now(),
      isImage: false
    };

    // Optimistically update UI with proper key
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Make the API call
      const { data } = await axios.post(
        `/api/message/${mode}`,
        {
          chatId: currentChatId,
          prompt: promptCopy,
          isPublished
        },
        { headers: { Authorization: token } }
      );

      if (data.success) {
        // Create AI message
        const aiMessage = {
          role: 'assistant',
          content: data.reply?.content || data.replay?.content || data.reply || data.replay || 'No response',
          timestamp: Date.now(),
          isImage: mode === 'image',
          ...(mode === 'image' && {
            imageUrl: data.reply?.imageUrl || data.replay?.imageUrl || data.imageUrl
          })
        };

        // Update state with both messages
        const finalMessages = [...messages, userMessage, aiMessage];
        
        // Update local state
        setMessages(finalMessages);
        
        // Update the chat with new messages and move it to the top
        const updatedChat = {
          messages: finalMessages,
          updatedAt: new Date().toISOString()
        };
        
        // Use the updateChat function to update both selected chat and chats list
        updateChat(currentChatId, updatedChat);
        
        // Move the updated chat to the top of the list
        setChats(prevChats => {
          const filteredChats = prevChats.filter(chat => chat._id !== currentChatId);
          const updatedChatData = {
            ...selectedChat,
            ...updatedChat
          };
          return [updatedChatData, ...filteredChats];
        });

        // Update credits (only once)
        const creditDeduction = mode === 'image' ? 2 : 1;
        setUser(prev => ({
          ...prev,
          credits: Math.max(0, (prev.credits || 0) - creditDeduction)
        }));
      }else{
        console.error('API Error:', data.message);
        toast.error(data.message)
        setPrompt(promptCopy)
        // Remove the user message if API call failed
        setMessages(prev => prev.slice(0, -1))
      }
    } catch (error) {
      console.error('Request failed:', error);
      toast.error(error.response?.data?.message || error.message)
      setPrompt(promptCopy)
      // Remove the user message if API call failed
      setMessages(prev => prev.slice(0, -1))
    }finally{
      setLoading(false)
      // Add a small delay to prevent race conditions with chat fetching
      setTimeout(() => {
        setIsChatting(false)
      }, 100)
    }
  };

  // Handle Enter key submission without page reload
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  // Update messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      const currentChatId = selectedChat?._id;
      setMessages(prev => {
        // Only update if the chat ID is different to prevent unnecessary re-renders
        if (prev.length === 0 || prev[0]?.chatId !== currentChatId) {
          return selectedChat.messages || [];
        }
        return prev;
      });
    } else {
      setMessages([]);
    }
  }, [selectedChat?._id]);
  
  // Optimized scroll effect with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50); // Small delay to batch scroll operations

    return () => clearTimeout(timeoutId);
  }, [messages.length]); // Only depend on messages length, not the entire messages array

  return (
    <div className="flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40">
      {/* chat messages */}
      <div ref={containerRef} className="flex-1 mb-5 overflow-y-scroll">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
            <img
              src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
              className="w-full max-w-56 sm:max-w-58"
            />
            <p className="mt-5 text-4xl sm:text-6xl text-center text-gray-400">
              Ask me anything
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <Message key={`${message.timestamp}-${index}`} message={message} />
        ))}
        {/* 3 dot loading */}
        {loading && (
          <div className="loader flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
          </div>
        )}
      </div>

      {mode === "image" && (
        <label className="inline-flex items-center gap-2 mb-3 text-sm mx-auto">
          <p className="text-xs">Publish Generated Image to Community</p>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </label>
      )}

      {/* prompt input */}
      <form
        onSubmit={onSubmit}
        className="bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center"
      >
        <select
          onChange={(e) => setMode(e.target.value)}
          value={mode}
          className="text-sm pl-3 pr-2 outline-none"
        >
          <option className="dark:bg-purple-900" value="text">
            Text
          </option>
          <option className="dark:bg-purple-900" value="image">
            Image
          </option>
        </select>
        <input
          type="text"
          placeholder="Type your prompt here..."
          className="flex-1 w-full text-sm outline-none"
          required
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
          onKeyPress={handleKeyPress}
        />
        <button 
          type="submit"
          disabled={loading}
          onClick={onSubmit}
        >
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            alt=""
            className="w-8 cursor-pointer"
          />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;