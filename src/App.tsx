import { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import "./App.css";

// Helper function to calculate label offset based on location
const getLabelPosition = (lat: number, lng: number) => {
  // Special handling for European cluster with more spread out positioning
  if (lat > 45 && lat < 51 && lng > 8 && lng < 15) {
    if (lat > 49) return 0.15; // Prague
    if (lng < 9) return 0.08; // Zurich
    if (lat < 47) return 0.12; // Alpine Wonders
    return 0.05; // Munich
  }

  // Default altitude for other locations
  return 0.08;
};

// Helper to check if device is mobile
const isMobile = () => {
  return window.innerWidth <= 768;
};

// Create glowing marker material
const createMarkerMaterial = () => {
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color("#ffeb3b") }, // Warmer yellow color
      glowColor: { value: new THREE.Color("#ffeb3b") },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform vec3 glowColor;
      uniform float time;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        vec3 glow = glowColor * intensity * (1.0 + 0.2 * sin(time * 1.5));
        gl_FragColor = vec4(color + glow, 0.8);
      }
    `,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });

  return glowMaterial;
};

const markers = [
  { name: "Prague", lat: 50.0755, lng: 14.4378 },
  { name: "Zurich", lat: 47.3769, lng: 8.5417 },
  { name: "Vietnam", lat: 14.0583, lng: 108.2772 },
  { name: "Thailand", lat: 15.87, lng: 100.9925 },
  { name: "Manali", lat: 32.2432, lng: 77.1892 },
  { name: "Andaman and Nicobar", lat: 11.6234, lng: 92.7265 },
  { name: "Nag Tibba", lat: 30.4102, lng: 78.2445 },
  { name: "Bali", lat: -8.3405, lng: 115.092 },
].map((marker) => ({
  ...marker,
  size: 20,
  altitude: 0.01,
  labelAltitude: getLabelPosition(marker.lat, marker.lng),
}));

function App() {
  const globeRef = useRef<any>();
  const markerMaterial = useRef(createMarkerMaterial());
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const updateGlobeView = () => {
    if (globeRef.current) {
      const altitude = isMobile() ? 2.5 : 1.8;
      globeRef.current.pointOfView({
        lat: 15.0,
        lng: 100.0,
        altitude,
      });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      updateGlobeView();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      // Set initial view focused on Asian locations
      updateGlobeView();

      // Controls
      const controls = globeRef.current.controls();
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.minDistance = isMobile() ? 200 : 160;
      controls.maxDistance = 800;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;

      // Adjust initial camera position to avoid logo
      controls.minPolarAngle = Math.PI / 8;
      controls.maxPolarAngle = Math.PI - Math.PI / 3;

      // Mobile touch sensitivity
      if (isMobile()) {
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 1.2;
      }

      // Animate marker glow
      let time = 0;
      const animate = () => {
        time += 0.01;
        markerMaterial.current.uniforms.time.value = time;
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, []);

  return (
    <>
      <img src="/supersquad.svg" alt="SuperSquad" className="logo" />
      <div className="stars" />
      <div className="globe-container">
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
          pointsData={markers}
          pointLat="lat"
          pointLng="lng"
          pointAltitude="altitude"
          pointRadius={isMobile() ? 1.5 : 1.2}
          pointsMerge={false}
          pointResolution={32}
          pointLabel="name"
          pointColor="#ffeb3b"
          labelsData={markers}
          labelLat="lat"
          labelLng="lng"
          labelAltitude="labelAltitude"
          labelText="name"
          labelSize={isMobile() ? 1.2 : 1}
          labelDotRadius={0.4}
          labelDotOrientation={() => "right"}
          labelColor={() => "#FFFFFF"}
          labelResolution={2}
          atmosphereColor="#3a228a"
          atmosphereAltitude={0.15}
          onGlobeReady={() => {
            if (globeRef.current) {
              updateGlobeView();
              const controls = globeRef.current.controls();
              controls.autoRotate = true;
              controls.autoRotateSpeed = 0.3;
            }
          }}
        />
      </div>
    </>
  );
}

export default App;
