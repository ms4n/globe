import { useEffect, useState, useMemo } from "react";
import { Map as MapIcon } from "lucide-react";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { Info } from "lucide-react";
import Earth from "./components/Earth";
import Map from "./components/Map";
import tripLocations from "./data/locations";
import "./App.css";

function App() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showGlobe, setShowGlobe] = useState(true);
  const isMobile = dimensions.width <= 768;

  // Memoize theme to prevent recreation on every render
  const theme = useMemo(
    () => ({
      background: "#0a0c12",
      mapBackground: "#1a1d24",
      highlight: "rgba(103, 140, 187, 0.15)",
      stroke: "rgba(147, 155, 175, 0.08)",
    }),
    []
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const helperText = isMobile
    ? "Tap on points to explore destinations"
    : "Hover over points to explore destinations";

  return (
    <>
      <img src="/supersquad.svg" alt="SuperSquad" className="logo" />
      <div className="takeover-text">TAKEOVER</div>
      <div className="controls">
        <button
          className="view-toggle"
          onClick={() => setShowGlobe(!showGlobe)}
          aria-label={showGlobe ? "Switch to 2D map" : "Switch to 3D globe"}
        >
          {showGlobe ? <MapIcon size={24} /> : <HiOutlineGlobeAlt size={24} />}
        </button>
      </div>
      {showGlobe ? (
        <>
          <Earth locations={tripLocations} />
          <div className="info-message">
            <span>{helperText}</span>
          </div>
        </>
      ) : (
        <div className="map-container">
          <Map
            width={dimensions.width}
            height={dimensions.height}
            theme={theme}
            locations={tripLocations}
          />
        </div>
      )}
    </>
  );
}

export default App;
