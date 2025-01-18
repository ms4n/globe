import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { Feature, FeatureCollection } from "geojson";
import "./App.css";

interface Location {
  name: string;
  lat: number;
  lng: number;
}

function App() {
  const mapRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const isMobile = window.innerWidth <= 768;

  // Memoize theme to prevent recreation on every render
  const theme = useMemo(
    () => ({
      background: isDarkMode ? "#090a0f" : "#ffffff",
      mapBackground: isDarkMode ? "#1b2735" : "#f5f5f5",
      highlight: isDarkMode
        ? "rgba(154, 234, 116, 0.15)"
        : "rgba(74, 154, 36, 0.3)",
      stroke: isDarkMode
        ? "rgba(154, 234, 116, 0.1)"
        : "rgba(74, 154, 36, 0.2)",
    }),
    [isDarkMode]
  );

  // Memoize locations array
  const locations = useMemo<Location[]>(
    () => [
      { name: "Prague, Czech Republic", lat: 50.0755, lng: 14.4378 },
      { name: "Zurich, Switzerland", lat: 47.3769, lng: 8.5417 },
      { name: "Munich, Germany", lat: 48.1351, lng: 11.582 },
      { name: "Central Vietnam", lat: 14.0583, lng: 108.2772 },
      { name: "Central Thailand", lat: 15.87, lng: 100.9925 },
      { name: "Manali, India", lat: 32.2432, lng: 77.1892 },
      { name: "Andaman Islands, India", lat: 11.6234, lng: 92.7265 },
      { name: "Nag Tibba, India", lat: 30.4102, lng: 78.2445 },
      { name: "Bali, Indonesia", lat: -8.3405, lng: 115.092 },
    ],
    []
  );

  // Memoize center point calculation
  const centerPoint = useMemo(() => {
    const asianLocations = locations.filter(
      (loc) => loc.lat < 40 && loc.lat > -10 && loc.lng > 70 && loc.lng < 140
    );
    return {
      lat: d3.mean(asianLocations, (d) => d.lat) || 15,
      lng: d3.mean(asianLocations, (d) => d.lng) || 100,
    };
  }, [locations]);

  const updateTooltipPosition = useCallback((x: number, y: number) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.transform = `translate(${x}px, ${y - 30}px)`;
    }
  }, []);

  // Handle theme change
  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.background;
    document.body.style.backgroundColor = theme.background;
  }, [theme.background]);

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

  // Map rendering effect
  useEffect(() => {
    if (!mapRef.current) return;

    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    const projection = d3
      .geoMercator()
      .scale(
        isMobile
          ? ((width - 3) / (2 * Math.PI)) * 1.5
          : (width - 3) / (2 * Math.PI)
      )
      .translate([width / 2, height / 1.8]);

    const path = d3.geoPath().projection(projection);
    const container = svg.append("g");
    const g = container.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [-width * 2, -height * 2],
        [width * 3, height * 3],
      ])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        if (activeLocation) {
          const [x, y] = projection([activeLocation.lng, activeLocation.lat])!;
          const transformed = event.transform.apply([x, y]);
          updateTooltipPosition(transformed[0], transformed[1]);
        }
      });

    svg.call(zoom as any);

    // Set initial view
    if (isMobile) {
      const coords = projection([centerPoint.lng, centerPoint.lat]);
      if (coords) {
        svg.call(
          zoom.transform as any,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(2)
            .translate(-coords[0], -coords[1])
        );
      }
    } else {
      svg.call(zoom.transform as any, d3.zoomIdentity.translate(0, 0).scale(1));
    }

    // Add background
    g.append("rect")
      .attr("width", width * 6)
      .attr("height", height * 6)
      .attr("x", -width * 2)
      .attr("y", -height * 2)
      .attr("fill", theme.background);

    // Load and render map
    fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
      .then((response) => response.json())
      .then((data) => {
        const geojson = topojson.feature(
          data as any,
          (data as any).objects.countries
        ) as unknown as FeatureCollection;

        g.selectAll("path")
          .data(geojson.features)
          .join("path")
          .attr("d", path as any)
          .attr("fill", (d: Feature) => {
            const countryName = (d.properties as any)?.name;
            if (
              ["Czech Republic", "Switzerland", "Germany"].includes(countryName)
            )
              return theme.highlight;
            if (
              ["Thailand", "Vietnam", "India", "Indonesia"].includes(
                countryName
              )
            )
              return theme.highlight;
            return theme.mapBackground;
          })
          .attr("stroke", theme.stroke)
          .attr("stroke-width", 0.5);

        const handleMouseEnter = (_event: any, d: Location) => {
          const [x, y] = projection([d.lng, d.lat])!;
          const transform = d3.zoomTransform(svg.node()!);
          const transformed = transform.apply([x, y]);
          updateTooltipPosition(transformed[0], transformed[1]);
          setActiveLocation(d);
        };

        g.selectAll("circle")
          .data(locations)
          .join("circle")
          .attr("cx", (d) => projection([d.lng, d.lat])![0])
          .attr("cy", (d) => projection([d.lng, d.lat])![1])
          .attr("r", 3)
          .attr("fill", "#9AEA74")
          .attr("stroke", theme.background)
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .on("mouseenter", handleMouseEnter)
          .on("mouseleave", (event) => {
            const target = event.relatedTarget as Element;
            if (!target?.closest(".location-pill")) {
              setActiveLocation(null);
            }
          })
          .on("click", (event, d) => {
            event.stopPropagation();
            handleMouseEnter(event, d);
          });

        svg.on("click", () => setActiveLocation(null));
      });
  }, [dimensions, theme, locations, centerPoint, updateTooltipPosition]);

  return (
    <>
      <img
        src="/supersquad.svg"
        alt="SuperSquad"
        className={`logo ${isDarkMode ? "dark" : "light"}`}
      />
      <button
        className="theme-toggle"
        onClick={() => setIsDarkMode(!isDarkMode)}
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>
      <div className={`map-container ${isDarkMode ? "dark" : "light"}`}>
        <svg
          ref={mapRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ background: "transparent" }}
        />
        <div
          ref={tooltipRef}
          className={`location-pill ${activeLocation ? "visible" : ""} ${
            isDarkMode ? "dark" : "light"
          }`}
        >
          {activeLocation?.name}
        </div>
      </div>
    </>
  );
}

export default App;
