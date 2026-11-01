import { Route, Routes } from "react-router-dom";
import FloatingChat from "./components/FloatingChat";
import AppLayout from "./components/layout/AppLayout";
import { LoggerProvider } from "./context/LoggerContext";
import Chat from "./pages/Chat";
import Colonies from "./pages/Colonies";
import Compose from "./pages/Compose";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import Help from "./pages/Help";
import Inbox from "./pages/Inbox";
import Logging from "./pages/Logging";
import Marketplace from "./pages/Marketplace";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Safety from "./pages/Safety";
import Settings from "./pages/Settings";
import Skills from "./pages/Skills";
import Tools from "./pages/Tools";
import Webhooks from "./pages/Webhooks";

export default function App() {
  return (
    <LoggerProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="feed" element={<Feed />} />
          <Route path="compose" element={<Compose />} />
          <Route path="post/:id" element={<PostDetail />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="colonies" element={<Colonies />} />
          <Route path="profile" element={<Profile />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="safety" element={<Safety />} />
          <Route path="webhooks" element={<Webhooks />} />
          <Route path="logging" element={<Logging />} />
          <Route path="chat" element={<Chat />} />
          <Route path="tools" element={<Tools />} />
          <Route path="skills" element={<Skills />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
        </Route>
      </Routes>
      <FloatingChat />
    </LoggerProvider>
  );
}
