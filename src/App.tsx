import { useState } from "react";
import "./App.css";
import Lab1 from "./components/Lab1/Lab1";
import Lab2 from "./components/Lab2/Lab2";
import Lab3 from "./components/Lab3/Lab3";
import Lab4 from "./components/Lab4/Lab4";

type LabType = 1 | 2 | 3 | 4;

function App() {
  const [activeLab, setActiveLab] = useState<LabType>(1);

  const renderLab = () => {
    switch (activeLab) {
      case 1:
        return <Lab1 />;
      case 2:
        return <Lab2 />;
      case 3:
        return <Lab3 />;
      case 4:
        return <Lab4 />;
      default:
        return <Lab1 />;
    }
  };

  return (
    <div className="app">
      <nav className="lab-navigation">
        {[1, 2, 3, 4].map((labNum) => (
          <button
            key={labNum}
            className={`lab-button ${activeLab === labNum ? "active" : ""}`}
            onClick={() => setActiveLab(labNum as LabType)}
          >
            Лаб. {labNum}
          </button>
        ))}
      </nav>

      <main className="lab-container">{renderLab()}</main>
    </div>
  );
}

export default App;
