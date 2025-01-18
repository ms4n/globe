import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { Feature, FeatureCollection } from "geojson";

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface GlobeProps {
  isDarkMode: boolean;
  locations: Location[];
}

function Globe({ isDarkMode, locations }: GlobeProps) {
  const globeRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);

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

  const updateTooltipPosition = useCallback((x: number, y: number) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.transform = `translate(${x}px, ${y - 30}px)`;
    }
  }, []);

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

  // Globe rendering effect
  useEffect(() => {
    if (!globeRef.current) return;

    const svg = d3.select(globeRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;
    const scale = Math.min(width, height) * 0.5;

    const projection = d3
      .geoOrthographic()
      .scale(scale * 0.6)
      .translate([width / 2, height / 2])
      .rotate(rotation);

    const path = d3.geoPath().projection(projection);
    const container = svg.append("g");

    // Improved drag behavior with sensitivity adjustment
    const drag = d3.drag<SVGSVGElement, unknown>().on("drag", (event) => {
      const sensitivity = 0.25;
      const [x, y] = rotation;
      setRotation([
        (x + event.dx * sensitivity) % 360,
        Math.max(-90, Math.min(90, y - event.dy * sensitivity)),
        0,
      ]);
    });

    svg.call(drag as any);

    // Add background circle for ocean
    container
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())
      .attr("fill", theme.mapBackground)
      .attr("stroke", theme.stroke)
      .attr("stroke-width", 1);

    // Load and render map
    fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
      .then((response) => response.json())
      .then((data) => {
        const geojson = topojson.feature(
          data as any,
          (data as any).objects.countries
        ) as unknown as FeatureCollection;

        // Add graticules for better visual reference
        const graticule = d3.geoGraticule();
        container
          .append("path")
          .datum(graticule)
          .attr("class", "graticule")
          .attr("d", path as any)
          .attr("fill", "none")
          .attr("stroke", theme.stroke)
          .attr("stroke-width", 0.3)
          .attr("stroke-opacity", 0.5);

        container
          .selectAll("path.country")
          .data(geojson.features)
          .join("path")
          .attr("class", "country")
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
          updateTooltipPosition(x, y);
          setActiveLocation(d);
        };

        // Add location markers with improved visibility check
        container
          .selectAll("circle.location")
          .data(locations)
          .join("circle")
          .attr("class", "location")
          .attr("cx", (d) => {
            const coords = projection([d.lng, d.lat]);
            return coords ? coords[0] : 0;
          })
          .attr("cy", (d) => {
            const coords = projection([d.lng, d.lat]);
            return coords ? coords[1] : 0;
          })
          .attr("r", 4)
          .attr("fill", "#9AEA74")
          .attr("stroke", theme.background)
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .style("opacity", (d) => {
            const coords = projection([d.lng, d.lat]);
            if (!coords) return 0;
            // Check if point is visible (not on the back of the globe)
            const visible = projection.rotate()[0] * -1;
            const distance = d3.geoDistance(
              [d.lng, d.lat],
              [visible, projection.rotate()[1] * -1]
            );
            return distance > Math.PI / 2 ? 0 : 1;
          })
          .on("mouseenter", handleMouseEnter)
          .on("mouseleave", () => setActiveLocation(null))
          .on("click", (event, d) => {
            event.stopPropagation();
            handleMouseEnter(event, d);
          });
      });
  }, [dimensions, theme, locations, rotation, updateTooltipPosition]);

  return (
    <div className={`globe-container ${isDarkMode ? "dark" : "light"}`}>
      <svg
        ref={globeRef}
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
  );
}

export default Globe;
