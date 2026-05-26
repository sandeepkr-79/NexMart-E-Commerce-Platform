import React from "react";
import { MessageSquare, RefreshCw } from "lucide-react";
import { useGetChatHistoryQuery } from "../../app/apiSlice.js";

const Chats = () => {
  const { data, isLoading, isError } = useGetChatHistoryQuery();
  const chats = data?.chats || [];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">
            AI Chat History
          </h2>
          <p className="text-xs text-slate-400">
            Review your conversations with the NexMart assistant and continue
            your shopping flow.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm gap-2 text-slate-300 border border-slate-800 hover:text-white">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-slate-900 border border-slate-800 rounded-2xl h-24"
            ></div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-400">
            Could not load chat history. Make sure the backend is running.
          </p>
        </div>
      ) : chats.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <MessageSquare size={40} className="mx-auto text-violet-400" />
          <p className="text-sm text-slate-400">
            No saved chat sessions yet. Start chatting with the assistant to
            build a history.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map((chat) => (
            <div
              key={chat._id || chat.sessionId}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5"
            >
              <div className="flex justify-between items-center gap-4 mb-3">
                <div>
                  <h3 className="font-bold text-slate-100">
                    Session {chat.sessionId?.slice(-6) || "Chat"}
                  </h3>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {new Date(chat.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="badge badge-primary badge-sm">
                  {chat.messages.length} messages
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                {chat.messages.slice(-3).map((msg, idx) => (
                  <p
                    key={idx}
                    className={
                      msg.role === "user" ? "text-slate-200" : "text-slate-400"
                    }
                  >
                    <span className="uppercase text-[10px] text-slate-500 mr-2">
                      {msg.role}
                    </span>
                    {msg.content}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chats;
