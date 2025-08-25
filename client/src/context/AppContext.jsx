import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isChatting, setIsChatting] = useState(false);

  // Fetch user info
  const fetchUser = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: token },
      });
      if (data.success) {
        setUser(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingUser(false);
    }
  }, [token]);

  // Fetch user chats
  const fetchUsersChats = useCallback(async (forceSelectRecent = false) => {
    try {
      const { data } = await axios.get("/api/chat/get", {
        headers: { Authorization: token },
      });
      if (data.success) {
        setChats(data.chats);

        if (data.chats.length === 0) {
          // Create a new chat, but avoid infinite recursion
          await createNewChat();
          return;
        }

        // Select the most recent chat if forced or if no chat is selected
        if (forceSelectRecent || !selectedChat) {
          setSelectedChat(data.chats[0]);
        } else if (!isChatting) {
          // Update the selected chat with fresh data if it exists in the fetched chats
          const updatedSelectedChat = data.chats.find(chat => chat._id === selectedChat._id);
          if (updatedSelectedChat) {
            setSelectedChat(updatedSelectedChat);
          } else {
            // If the current selected chat doesn't exist anymore, select the most recent
            setSelectedChat(data.chats[0]);
          }
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [token, selectedChat, isChatting]);

  // Create new chat
  const createNewChat = useCallback(async () => {
    try {
      if (!user) return toast("Login to create a new chat");
      
      // Only navigate if we're not already on the chat page
      if (window.location.pathname !== '/') {
        navigate("/");
      }
      
      const { data } = await axios.get("/api/chat/create", {
        headers: { Authorization: token },
      });
      if (data.success && data.chat) {
        // Update chats state with the new chat
        setChats(prevChats => [data.chat, ...prevChats]);
        // Set the newly created chat as selected
        setSelectedChat(data.chat);
      } else {
        // Fallback to fetching all chats if the response doesn't include the new chat
        await fetchUsersChats();
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [user, token, navigate, fetchUsersChats]); // memoized

  // Theme effect
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Load chats whenever user changes
  useEffect(() => {
    if (user) {
      // Force select the most recent chat when user first loads the app
      fetchUsersChats(true);
      // Only navigate to chat page on initial load, not on every user state change
      if (window.location.pathname === '/') {
        // User is on root, ensure they see the chat
        navigate('/');
      }
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [user, navigate]);

  // Load user when token changes
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
      setLoadingUser(false);
    }
  }, [token, fetchUser]);

  // Ensure most recent chat is selected on initial app load
  useEffect(() => {
    if (user && chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0]);
    }
  }, [user, chats, selectedChat]);

  // Handle initial app load and navigation
  useEffect(() => {
    if (user && window.location.pathname === '/') {
      // Only navigate to chat page if user is on root and no specific route is requested
      navigate('/');
    }
  }, [user, navigate]);

  // Function to update a specific chat
  const updateChat = useCallback((chatId, updatedChat) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat._id === chatId ? { ...chat, ...updatedChat } : chat
      )
    );
    
    // Also update selected chat if it's the same chat
    setSelectedChat(prev => 
      prev?._id === chatId ? { ...prev, ...updatedChat } : prev
    );
  }, []);

  const value = {
    navigate,
    user,
    setUser,
    fetchUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    createNewChat,
    loadingUser,
    fetchUsersChats,
    token,
    setToken,
    axios,
    updateChat,
    isChatting,
    setIsChatting,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
