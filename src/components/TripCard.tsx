import { TripLocation } from "../data/locations";
import { useEffect, useState } from "react";

interface TripCardProps {
  trip: TripLocation;
  position: { x: number; y: number };
  onHide?: () => void;
  isVisible?: boolean;
}

function TripCard({
  trip,
  position,
  onHide,
  isVisible: controlledVisible,
}: TripCardProps) {
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    setShouldRender(true);
  }, [trip]); // Reset visibility when trip changes

  useEffect(() => {
    // Only use auto-hide timer if isVisible prop is not provided
    if (controlledVisible === undefined) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2500); // Start fade out after 2.5 seconds

      return () => clearTimeout(hideTimer);
    }
  }, [trip, controlledVisible]);

  // Handle transition end
  useEffect(() => {
    const currentVisibility = controlledVisible ?? isVisible;
    if (!currentVisibility) {
      const transitionTimer = setTimeout(() => {
        setShouldRender(false);
        onHide?.();
      }, 200); // Match this with the CSS transition duration

      return () => clearTimeout(transitionTimer);
    }
  }, [isVisible, onHide, controlledVisible]);

  useEffect(() => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 768;

    // Get card dimensions after it's rendered
    const card = document.querySelector(".trip-card") as HTMLElement;
    if (!card) return;

    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;

    // Calculate adjusted position to keep card in viewport
    let adjustedX = position.x;
    let adjustedY = position.y;

    if (isMobile) {
      // Center horizontally on mobile
      adjustedX = Math.max(
        20,
        Math.min(viewportWidth - cardWidth - 20, adjustedX)
      );
      // Prefer showing below the point on mobile, but flip up if not enough space
      if (position.y + cardHeight > viewportHeight - 20) {
        adjustedY = position.y - cardHeight - 20;
      }
    } else {
      // Desktop positioning
      if (position.x + cardWidth > viewportWidth) {
        adjustedX = position.x - cardWidth - 40;
      }
      if (position.y + cardHeight > viewportHeight) {
        adjustedY = viewportHeight - cardHeight - 20;
      }
    }

    // Ensure card doesn't go off left or top edge
    adjustedX = Math.max(20, adjustedX);
    adjustedY = Math.max(20, adjustedY);

    setAdjustedPosition({ x: adjustedX, y: adjustedY });
  }, [position]);

  if (!shouldRender) return null;

  const currentVisibility = controlledVisible ?? isVisible;

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
        opacity: currentVisibility ? 1 : 0,
        transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: "none",
        transform: `scale(${currentVisibility ? 1 : 0.98})`,
        transformOrigin: "center",
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
