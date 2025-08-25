import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import moment from "moment";
import toast from "react-hot-toast";

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {
  const {
    chats,
    setSelectedChat,
    selectedChat,
    theme,
    setTheme,
    user,
    navigate,
    createNewChat,
    axios,
    token,
    setChats,
    fetchUsersChats,
    setToken,
  } = useAppContext();
  const [search, setSearch] = useState("");

  const logout = ()=>{
    localStorage.removeItem('token')
    setToken(null)
    toast.success('Logged out successfully')
  }

  const deleteChat = async (e, chatId) => {
    try {
      e.stopPropagation()
      const confirm = window.confirm('Are you sure you want to delete this chat?')
      if(!confirm) return
      const {data} = await axios.post('/api/chat/delete', {chatId}, {headers: { Authorization : token }})
      if(data.success){
        setChats(prev => prev.filter(chat => chat._id !== chatId))
        await fetchUsersChats()
        toast.success(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const sidebarRef = useRef(null);

  // Handle sidebar open/close effects
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= 768 && isMenuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    // Prevent body scroll when sidebar is open on mobile
    if (isMenuOpen && window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <div
      ref={sidebarRef}
      className={`flex flex-col h-screen min-w-72 p-5 dark:bg-gradient-to-b from-[#242124] to-[#000000]/30 border-r border-[#80609f]/30 backdrop-blur-3xl transition-all duration-500 max-md:absolute left-0 z-10 ${
        !isMenuOpen ? "max-md:-translate-x-full" : "max-md:translate-x-0"
      }`}
    >
      {/* logo */}
      <div
        onClick={() => {
          navigate("/");
          setIsMenuOpen(false);
        }}
      >
        <img
          src={theme === "light" ? assets.logo_full_dark : assets.logo_full}
          alt=""
          className="w-full max-w-48"
        />
      </div>

      {/* new chat */}
      <button onClick={createNewChat} className="flex justify-center items-center w-full py-2 mt-10 text-white bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-sm rounded-md cursor-pointer ">
        <span className="mr-2 text-xl">+</span>New Chat
      </button>
      <div className="flex items-center gap-2 p-3 mt-4 border border-gray-400 dark:border-white/20 rounded-md">
        <img src={assets.search_icon} alt="" />
        <input
          type="text"
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          value={search}
          placeholder="Search Conversations"
          className="text-xs placeholder:text-gray-400 outline-none"
        />
      </div>

      {/* chat list */}

      {chats.length > 0 && <p className="mt-4 text-sm">Recent Chats</p>}
      <div className="flex-1 overflow-y-scroll mt-3 text-sm space-y-3">
        {chats
          .slice() // copy array
          .reverse() // most recent first
          .filter((chat) =>
            chat.messages[0]
              ? chat.messages[0]?.content
                  .toLowerCase()
                  .includes(search.toLowerCase())
              : chat.name.toLowerCase().includes(search.toLowerCase())
          )
          .map((chat) => (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedChat(chat);
                setIsMenuOpen(false);
                // Only navigate if we're not already on the chat page
                if (window.location.pathname !== '/') {
                  navigate("/");
                }
              }}
              key={chat._id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${selectedChat?._id === chat._id ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            >
              <div>
                <p>
                  {chat.messages.length > 0
                    ? chat.messages[0].content.slice(0, 32)
                    : chat.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#B2A6C0]">
                  {moment(chat.updatedAt).fromNow()}
                </p>
              </div>
              <img
                src={assets.bin_icon}
                className="hidden group-hover:block w-4 cursor-pointer not-dark:invert"
                onClick={e=> toast.promise(deleteChat(e, chat._id), {loading: 'deleting...'})}
                alt=""
              />
            </div>
          ))}
      </div>

      {/* community */}
      <div
        onClick={() => {
          navigate("/community");
          setIsMenuOpen(false);
        }}
        className="flex items-center gap-2 p-3 mt-4 border border-gray-300 dark:border-white/20 rounded-md cursor-pointer hover:scale-103 transition-all"
      >
        <img
          src={assets.gallery_icon}
          className="w-4.5 not-dark:invert"
          alt=""
        />
        <div className="flex flex-col text-sm">
          <p>Community Images</p>
        </div>
      </div>

      {/* credit */}
      <div
        onClick={() => {
          navigate("/credits");
          setIsMenuOpen(false);
        }}
        className="flex items-center gap-2 p-3 mt-4 border border-gray-300 dark:border-white/20 rounded-md cursor-pointer hover:scale-103 transition-all"
      >
        <img src={assets.diamond_icon} className="w-4.5 dark:invert" alt="" />
        <div className="flex flex-col text-sm">
          <p>Credits : {user?.credits}</p>
          <p className="text-xs text-gray-500">
            Purchase Credits to use quickGPT
          </p>
        </div>
      </div>

      {/* dark mode */}
      <div className="flex items-center justify-between gap-2 p-3 mt-4 border border-gray-300 dark:border-white/20 rounded-md">
        <div className="flex items-center gap-2 text-sm">
          <img src={assets.theme_icon} className="w-4 not-dark:invert" alt="" />
          <p>Light mode</p>
        </div>
        <label className="relative inline-flex cursor-pointer">
          <input
            type="checkbox"
            onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-400 rounded-full peer-checked:bg-purple-600 transition-all "></div>
          <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
        </label>
      </div>

      {/* user Account */}
      <div className="flex items-center gap-3 p-3 mt-4 border border-gray-300 dark:border-white/20 rounded-md cursor-pointer group hover:scale-103 transition-all">
        <img
          src={assets.user_icon}
          className="w-7 rounded-full not-dark:invert"
          alt=""
        />
        <p className="flex-1 text-sm dark:text-primary truncate">
          {user ? user.name : "Login your account"}
        </p>
        {user && (
          <img
            src={assets.logout_icon}
            className="h-5 cursor-pointer hidden not-dark:invert group-hover:block"
            onClick={logout}
          />
        )}
      </div>

      <img
        src={assets.close_icon}
        className="absolute top-3 right-3 w-5 h-5 cursor-pointer md:hidden not-dark:invert"
        alt=""
        onClick={() => setIsMenuOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
