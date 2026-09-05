import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ==========================================
  // LOAD SAVED CHATS
  // ==========================================

  useEffect(() => {
    const savedChats = localStorage.getItem("rohit-ai-chats");

    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);

        setChats(parsedChats);

        if (parsedChats.length > 0) {
          setActiveChatId(parsedChats[0].id);
          setMessages(parsedChats[0].messages || []);
        }
      } catch (error) {
        console.error("Could not load saved chats:", error);
      }
    }
  }, []);

  // ==========================================
  // SAVE CHATS
  // ==========================================

  useEffect(() => {
    localStorage.setItem(
      "rohit-ai-chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  // ==========================================
  // CREATE NEW CHAT
  // ==========================================

  const createNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setQuestion("");
    setSidebarOpen(false);
  };

  // ==========================================
  // SELECT CHAT
  // ==========================================

  const selectChat = (chat) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages || []);
    setQuestion("");
    setSidebarOpen(false);
  };

  // ==========================================
  // DELETE CHAT
  // ==========================================

  const deleteChat = (event, chatId) => {
    event.stopPropagation();

    const updatedChats = chats.filter(
      (chat) => chat.id !== chatId
    );

    setChats(updatedChats);

    if (activeChatId === chatId) {
      if (updatedChats.length > 0) {
        setActiveChatId(updatedChats[0].id);
        setMessages(updatedChats[0].messages || []);
      } else {
        setActiveChatId(null);
        setMessages([]);
      }
    }
  };

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = async () => {
    if (!question.trim() || loading) {
      return;
    }

    const currentQuestion = question.trim();

    const userMessage = {
      role: "user",
      content: currentQuestion,
    };

    const previousMessages = [...messages];

    const updatedMessages = [
      ...previousMessages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setQuestion("");
    setLoading(true);

    let chatId = activeChatId;

    // ========================================
    // CREATE CHAT IF FIRST MESSAGE
    // ========================================

    if (!chatId) {
      chatId = Date.now().toString();

      setActiveChatId(chatId);

      const title =
        currentQuestion.length > 40
          ? currentQuestion.substring(0, 40) + "..."
          : currentQuestion;

      const newChat = {
        id: chatId,
        title: title,
        messages: updatedMessages,
      };

      setChats((prev) => [newChat, ...prev]);
    } else {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: updatedMessages,
              }
            : chat
        )
      );
    }

    // ========================================
    // CALL BACKEND
    // ========================================

    try {
      const response = await fetch(
        "https://hireme-ai-ypi5.onrender.com/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question: currentQuestion,
            messages: previousMessages,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        content:
          data.answer ||
          "I couldn't generate a response.",
      };

      const finalMessages = [
        ...updatedMessages,
        assistantMessage,
      ];

      setMessages(finalMessages);

      // ======================================
      // SAVE ASSISTANT RESPONSE
      // ======================================

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: finalMessages,
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage = {
        role: "assistant",
        content:
          "Sorry, I couldn't connect to the backend. Please make sure FastAPI is running.",
      };

      const finalMessages = [
        ...updatedMessages,
        errorMessage,
      ];

      setMessages(finalMessages);

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: finalMessages,
              }
            : chat
        )
      );
    }

    setLoading(false);
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  // ==========================================
  // SUGGESTION BUTTON
  // ==========================================

  const askQuestion = (text) => {
    setQuestion(text);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="app">

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >

        <div className="sidebar-top">

          {/* BRAND */}

          <div className="brand">

            <div className="brand-icon">
              R
            </div>

            <div className="brand-text">
              <h2>Rohit's AI</h2>
              <span>Portfolio Assistant</span>
            </div>

          </div>


          {/* NEW CHAT */}

          <button
            className="new-chat"
            onClick={createNewChat}
          >
            <span className="plus-icon">＋</span>
            <span>New Chat</span>
          </button>

        </div>


        {/* =====================================
            RECENT CHATS
        ====================================== */}

        <div className="recent-section">

          <div className="recent-heading">
            Recent
          </div>

          {chats.length === 0 ? (

            <div className="empty-history">

              <div className="empty-icon">
                💬
              </div>

              <p>
                Your conversations will
                appear here.
              </p>

            </div>

          ) : (

            <div className="history-list">

              {chats.map((chat) => (

                <div
                  key={chat.id}
                  className={`history-item ${
                    activeChatId === chat.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectChat(chat)
                  }
                >

                  <span className="chat-icon">
                    💬
                  </span>

                  <span className="chat-title">
                    {chat.title}
                  </span>

                  <button
                    className="delete-chat"
                    onClick={(event) =>
                      deleteChat(
                        event,
                        chat.id
                      )
                    }
                    title="Delete chat"
                  >
                    ×
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* =====================================
            SIDEBAR FOOTER
        ====================================== */}

        <div className="sidebar-footer">

          <div className="profile-circle">
            R
          </div>

          <div className="profile-info">

            <strong>
              Rohit Kumar
            </strong>

            <span>
              AI Portfolio
            </span>

          </div>

        </div>

      </aside>


      {/* =====================================
          MAIN CHAT
      ====================================== */}

      <main className="chat-container">

        {/* HEADER */}

        <header className="header">

          <button
            className="mobile-menu"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            ☰
          </button>

          <div className="header-content">

            <h1>
              Rohit Kumar
            </h1>

            <p>
              AI Portfolio Assistant
            </p>

          </div>

        </header>


        {/* =====================================
            MESSAGES
        ====================================== */}

        <div className="messages">

          {messages.length === 0 ? (

            /* WELCOME */

            <div className="welcome">

              <div className="welcome-icon">
                🤖
              </div>

              <h2>
                Hi! I'm Rohit's AI Assistant
              </h2>

              <p>
                Ask me about Rohit's skills,
                education, projects,
                experience, or achievements.
              </p>


              <div className="suggestions">

                <button
                  onClick={() =>
                    askQuestion(
                      "Tell me about Rohit's projects."
                    )
                  }
                >

                  <span className="suggestion-icon">
                    💻
                  </span>

                  <span>
                    Tell me about Rohit's projects
                  </span>

                </button>


                <button
                  onClick={() =>
                    askQuestion(
                      "What are Rohit's technical skills?"
                    )
                  }
                >

                  <span className="suggestion-icon">
                    🛠️
                  </span>

                  <span>
                    What are Rohit's technical skills?
                  </span>

                </button>


                <button
                  onClick={() =>
                    askQuestion(
                      "Tell me about Rohit's education."
                    )
                  }
                >

                  <span className="suggestion-icon">
                    🎓
                  </span>

                  <span>
                    Tell me about Rohit's education
                  </span>

                </button>

              </div>

            </div>

          ) : (

            /* CONVERSATION */

            <div className="conversation">

              {messages.map(
                (message, index) => (

                  <div
                    key={index}
                    className={`message ${
                      message.role
                    }`}
                  >

                    {message.role ===
                      "assistant" && (

                      <div className="avatar assistant-avatar">
                        R
                      </div>

                    )}


                    <div className="message-content">

                      <ReactMarkdown
                        remarkPlugins={[
                          remarkGfm,
                        ]}
                      >
                        {message.content}
                      </ReactMarkdown>

                    </div>


                    {message.role ===
                      "user" && (

                      <div className="avatar user-avatar">
                        You
                      </div>

                    )}

                  </div>

                )
              )}


              {/* LOADING */}

              {loading && (

                <div className="message assistant">

                  <div className="avatar assistant-avatar">
                    R
                  </div>

                  <div className="message-content typing">

                    <span></span>
                    <span></span>
                    <span></span>

                  </div>

                </div>

              )}

            </div>

          )}

        </div>


        {/* =====================================
            INPUT
        ====================================== */}

        <div className="input-wrapper">

          <div className="input-area">

            <input
              type="text"
              value={question}
              placeholder="Ask something about Rohit..."
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button
              onClick={sendMessage}
              disabled={
                loading ||
                !question.trim()
              }
              title="Send message"
            >
              ↑
            </button>

          </div>

          <p className="input-hint">
            Rohit's AI can answer questions
            about his portfolio.
          </p>

        </div>

      </main>

    </div>
  );
}

export default App;