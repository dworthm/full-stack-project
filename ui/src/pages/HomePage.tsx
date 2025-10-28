import ChatbotUI from "../features/Chat";

const HomePage = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
      <h1 className="text-5xl font-bold tracking-tight">ThreadWise</h1>
      <p className="mt-4 text-lg text-slate-600">
        Welcome to ThreadWise's Chatbot. Ask me something about insurance...
      </p>
      <div className="mt-8 flex gap-4">
        <ChatbotUI/>
      </div>
    </main>
  );
};

export default HomePage;
