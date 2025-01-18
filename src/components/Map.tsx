import { useEffect, useRef, memo, useState, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { FeatureCollection, GeoJsonProperties } from "geojson";
import { TripLocation } from "../data/locations";
import TripCard from "./TripCard";

interface MapProps {
  width: number;
  height: number;
  theme: {
    background: string;
    mapBackground: string;
    highlight: string;
    stroke: string;
  };
  locations: TripLocation[];
}

function Map({ width, height, theme, locations }: MapProps) {
  const mapRef = useRef<SVGSVGElement>(null);
  const [activeTrip, setActiveTrip] = useState<{
    trip: TripLocation;
    position: { x: number; y: number };
  } | null>(null);

  // Memoize the projection setup to prevent unnecessary recalculations
  const setupProjection = useCallback(() => {
    const isMobile = width <= 768;
    return d3
      .geoMercator()
      .scale(isMobile ? width * 0.5 : width * 0.4)
      .center(isMobile ? [95, 10] : [95, 20])
      .translate([width / 2, height / 2]);
  }, [width, height]);

  // Handle marker interactions
  const handleMarkerInteraction = useCallback(
    (event: MouseEvent | TouchEvent, trip: TripLocation | null) => {
      if (trip) {
        const { clientX, clientY } =
          event instanceof TouchEvent ? event.touches[0] : event;
        setActiveTrip({
          trip,
          position: { x: clientX + 20, y: clientY - 20 },
        });
      } else {
        setActiveTrip(null);
      }
    },
    []
  );

  useEffect(() => {
    if (!mapRef.current) return;

    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove();

    // Create main container group
    const container = svg.append("g").attr("class", "map-container");

    // Setup projection and path generator
    const projection = setupProjection();
    const path = d3.geoPath(projection);

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Load and render world map
    fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
      .then((response) => response.json())
      .then((data) => {
        const geojson = topojson.feature(
          data,
          data.objects.countries
        ) as unknown as FeatureCollection<any, GeoJsonProperties>;

        // Draw countries
        container
          .append("g")
          .attr("class", "countries")
          .selectAll("path")
          .data(geojson.features)
          .join("path")
          .attr("d", path)
          .attr("fill", (d) => {
            const countryName = d.properties?.name;
            return [
              "Czech Republic",
              "Switzerland",
              "Germany",
              "Thailand",
              "Vietnam",
              "India",
              "Indonesia",
            ].includes(countryName)
              ? theme.highlight
              : theme.mapBackground;
          })
          .attr("stroke", theme.stroke)
          .attr("stroke-width", 0.5);

        // Create markers container
        const markers = container
          .append("g")
          .attr("class", "markers")
          .selectAll("g")
          .data(locations)
          .join("g")
          .attr("class", "marker-group")
          .attr("transform", (d) => {
            const [x, y] = projection([d.location.lng, d.location.lat]) || [
              0, 0,
            ];
            return `translate(${x},${y})`;
          });

        // Add pulse circles
        markers.append("circle").attr("class", "marker-pulse").attr("r", 12);

        // Add marker circles
        markers
          .append("circle")
          .attr("class", "marker-point")
          .attr("r", 6)
          .on(
            "mouseenter",
            function (
              this: SVGCircleElement,
              event: MouseEvent,
              d: TripLocation
            ) {
              d3.select(this.parentElement as Element)
                .raise()
                .select(".marker-point")
                .transition()
                .duration(200)
                .attr("r", 8);
              handleMarkerInteraction(event, d);
            }
          )
          .on("mouseleave", (event) => {
            d3.selectAll(".marker-point")
              .transition()
              .duration(200)
              .attr("r", 6);
            handleMarkerInteraction(event, null);
          })
          .on(
            "touchstart",
            function (
              this: SVGCircleElement,
              event: TouchEvent,
              d: TripLocation
            ) {
              event.preventDefault();
              d3.select(this.parentElement as Element)
                .raise()
                .select(".marker-point")
                .transition()
                .duration(200)
                .attr("r", 8);
              handleMarkerInteraction(event, d);
            }
          );

        // Initial zoom for both mobile and desktop
        const initialScale = width <= 768 ? 1.2 : 1;
        const initialX = width <= 768 ? width * 0.1 : 0;
        const initialY = width <= 768 ? -height * 0.1 : 0;

        svg.call(
          zoom.transform,
          d3.zoomIdentity.translate(initialX, initialY).scale(initialScale)
        );
      });

    return () => {
      svg.selectAll("*").remove();
      svg.on(".zoom", null);
    };
  }, [
    width,
    height,
    theme,
    locations,
    setupProjection,
    handleMarkerInteraction,
  ]);

  return (
    <div className="map-wrapper">
      <svg ref={mapRef} width={width} height={height} className="map" />
      {activeTrip && (
        <TripCard
          trip={activeTrip.trip}
          position={activeTrip.position}
          onHide={() => setActiveTrip(null)}
        />
      )}
    </div>
  );
}

export default memo(Map);
