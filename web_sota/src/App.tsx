import { Routes, Route } from "react-router-dom";
import { LoggerProvider } from "./context/LoggerContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import Compose from "./pages/Compose";
import PostDetail from "./pages/PostDetail";
import Inbox from "./pages/Inbox";
import Colonies from "./pages/Colonies";
import Profile from "./pages/Profile";
import Marketplace from "./pages/Marketplace";
import Safety from "./pages/Safety";
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
        </Route>
      </Routes>
    </LoggerProvider>
  );
}
