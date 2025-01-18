import { TripLocation } from "../data/locations";
import { useEffect, useState } from "react";

interface TripCardProps {
  trip: TripLocation;
  position: { x: number; y: number };
  onHide?: () => void;
}

function TripCard({ trip, position, onHide }: TripCardProps) {
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    setShouldRender(true);
  }, [trip]); // Reset visibility when trip changes

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500); // Start fade out after 2.5 seconds

    return () => clearTimeout(hideTimer);
  }, [trip]);

  // Handle transition end
  useEffect(() => {
    if (!isVisible) {
      const transitionTimer = setTimeout(() => {
        setShouldRender(false);
        onHide?.();
      }, 200); // Match this with the CSS transition duration

      return () => clearTimeout(transitionTimer);
    }
  }, [isVisible, onHide]);

  useEffect(() => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get card dimensions after it's rendered
    const card = document.querySelector(".trip-card") as HTMLElement;
    if (!card) return;

    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;

    // Calculate adjusted position to keep card in viewport
    let adjustedX = position.x;
    let adjustedY = position.y;

    // Adjust X if card would go off right edge
    if (position.x + cardWidth > viewportWidth) {
      adjustedX = position.x - cardWidth - 40;
    }

    // Adjust Y if card would go off bottom edge
    if (position.y + cardHeight > viewportHeight) {
      adjustedY = viewportHeight - cardHeight - 20;
    }

    // Ensure card doesn't go off left or top edge
    adjustedX = Math.max(20, adjustedX);
    adjustedY = Math.max(20, adjustedY);

    setAdjustedPosition({ x: adjustedX, y: adjustedY });
  }, [position]);

  if (!shouldRender) return null;

  return (
    <div
      className="trip-card"
      style={{
        position: "fixed",
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        background: "rgba(26, 29, 36, 0.95)",
        backdropFilter: "blur(8px)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        padding: "8px",
        color: "white",
        fontSize: "14px",
        maxWidth: "280px",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.2s ease-out",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "stretch",
          minHeight: "64px",
        }}
      >
        <img
          src={trip.host.image}
          alt={trip.host.name}
          className="host-image"
          loading="eager"
          style={{
            borderRadius: "6px",
            width: "48px",
            height: "auto",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h3
            style={{
              margin: "0 0 4px 0",
              fontSize: "15px",
              fontWeight: 500,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.3",
            }}
          >
            {trip.title}
          </h3>
          <p style={{ margin: "0 0 2px 0", opacity: 0.8, fontSize: "13px" }}>
            {trip.location.name}
          </p>
          <p style={{ margin: 0, opacity: 0.7, fontSize: "12px" }}>
            {trip.host.name}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TripCard;
