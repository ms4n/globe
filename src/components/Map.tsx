import { useEffect, useRef, memo } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { Feature, FeatureCollection, GeoJsonProperties } from "geojson";
import { TripLocation } from "../data/locations";

interface MapProps {
  width: number;
  height: number;
  theme: {
    background: string;
    mapBackground: string;
    highlight: string;
    stroke: string;
  };
  onHover: (trip: TripLocation | null, x: number, y: number) => void;
  locations: TripLocation[];
}

function Map({ width, height, theme, onHover, locations }: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= 768;

    // Clear previous content
    svg.selectAll("*").remove();

    // Create container for zoom
    const container = svg.append("g");

    // Increase scale and adjust center for mobile
    const projection = d3
      .geoMercator()
      .scale(isMobile ? width * 0.85 : width * 0.45)
      .center(isMobile ? [80, 20] : [100, 20])
      .translate([width / 2, height / 2]);

    const path = d3.geoPath(projection);

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, isMobile ? 8 : 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // If mobile, set initial zoom
    if (isMobile) {
      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(width * 0.1, 0).scale(1.2)
      );
    }

    // Load and render map
    fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
      .then((response) => response.json())
      .then((data) => {
        const geojson = topojson.feature(
          data,
          data.objects.countries
        ) as unknown as FeatureCollection<any, GeoJsonProperties>;

        // Add graticules for better visual reference
        const graticule = d3.geoGraticule();
        container
          .append("path")
          .datum(graticule as unknown as Feature)
          .attr("class", "graticule")
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", theme.stroke)
          .attr("stroke-width", 0.3)
          .attr("stroke-opacity", 0.5);

        container
          .selectAll<SVGPathElement, Feature<any, GeoJsonProperties>>(
            "path.country"
          )
          .data(geojson.features)
          .join("path")
          .attr("class", "country")
          .attr("d", path)
          .attr("fill", (d) => {
            const countryName = d.properties?.name;
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

        // Add location markers
        container
          .selectAll<SVGCircleElement, TripLocation>("circle.location")
          .data(locations)
          .join("circle")
          .attr("class", "location")
          .attr("cx", (d) => {
            const coords = projection([d.location.lng, d.location.lat]);
            return coords ? coords[0] : 0;
          })
          .attr("cy", (d) => {
            const coords = projection([d.location.lng, d.location.lat]);
            return coords ? coords[1] : 0;
          })
          .attr("r", 4)
          .attr("fill", "rgba(147, 180, 224, 0.95)")
          .attr("stroke", theme.background)
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("mouseenter", (_event, d) => {
            const [x, y] = projection([d.location.lng, d.location.lat])!;
            onHover(d, x, y - 30);
          })
          .on("mouseleave", () => onHover(null, 0, 0));
      });

    // Cleanup function
    return () => {
      svg.selectAll("*").remove();
      svg.on(".zoom", null);
    };
  }, [width, height, theme, locations, onHover]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: "transparent" }}
    />
  );
}

export default memo(Map);
