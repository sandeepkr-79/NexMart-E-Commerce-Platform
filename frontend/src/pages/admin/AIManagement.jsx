import React from "react";
import { useGetChatHistoryQuery } from "../../app/apiSlice.js";
import { Cpu, MessageSquare, Sparkles } from "lucide-react";

const AIManagement = () => {
  const { data, isLoading, isError } = useGetChatHistoryQuery();
  const history = data?.chats || [];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">AI Management</h2>
        <p className="text-xs text-slate-400">
          Review chatbot history and manage automated AI workflows.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Chatbot usage</h3>
            <p className="text-sm text-slate-400">
              Track requests and key AI responses across the marketplace.
            </p>
          </div>
          <div className="badge badge-primary badge-outline">
            {history.length} sessions
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-slate-900 border border-slate-800 rounded-3xl h-20"
              ></div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
            <p className="text-sm text-slate-400">
              Unable to load AI history. Please try again later.
            </p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <Cpu size={36} className="mx-auto text-violet-400" />
            <p className="text-sm text-slate-400">
              No AI chat history found yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {history.map((item) => (
              <div
                key={item._id}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">
                      {item.prompt || "AI prompt"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Sparkles size={20} className="text-violet-400" />
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  {item.response || "No response recorded."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIManagement;
