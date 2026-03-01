import { SocketProvider } from "./context/SocketContext";
import { MatchProvider } from "./context/MatchContext";
import { Dashboard } from "./pages/Dashboard";

function App() {
  return (
    <SocketProvider>
      <MatchProvider>
        <Dashboard />
      </MatchProvider>
    </SocketProvider>
  );
}

export default App;
