import OverviewLayout from "./components/OverviewLayout";
import { useNetwork } from "./network/NetworkContext";

export default function App() {
  const network = useNetwork();

  return (
    <div className={["app-shell", network.themeClass].filter(Boolean).join(" ")}>
      <OverviewLayout />
    </div>
  );
}
