import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import * as d3 from "d3";
import { TripLocation } from "../data/locations";
import TripCard from "./TripCard";

interface EarthProps {
  locations: TripLocation[];
}

function Earth({ locations }: EarthProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeLocation, setActiveLocation] = useState<TripLocation | null>(
    null
  );
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [shouldRenderCard, setShouldRenderCard] = useState(false);

  // Calculate center of markers
  const centerPoint = useMemo(() => {
    const asianLocations = locations.filter(
      (loc) =>
        loc.location.lat < 40 &&
        loc.location.lat > -10 &&
        loc.location.lng > 70 &&
        loc.location.lng < 140
    );
    return {
      lat: d3.mean(asianLocations, (d) => d.location.lat) || 15,
      lng: d3.mean(asianLocations, (d) => d.location.lng) || 100,
    };
  }, [locations]);

  // Convert center point to initial rotation (flip longitude for proper rotation)
  const initialRotation: [number, number, number] = [
    centerPoint.lng + 90,
    centerPoint.lat,
    0,
  ];

  useEffect(() => {
    if (activeLocation) {
      setIsCardVisible(true);
      setShouldRenderCard(true);
      // Start fade out timer
      const hideTimer = setTimeout(() => {
        setIsCardVisible(false);
      }, 2500); // Hide after 2.5 seconds

      return () => clearTimeout(hideTimer);
    }
  }, [activeLocation]);

  // Handle card transition end and cleanup
  useEffect(() => {
    if (!isCardVisible && shouldRenderCard) {
      const transitionTimer = setTimeout(() => {
        setShouldRenderCard(false);
        setActiveLocation(null);
      }, 400); // Increased from 200ms to 400ms to match new transition duration

      return () => clearTimeout(transitionTimer);
    }
  }, [isCardVisible]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Add stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 6000;
    const positions = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);

    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = -Math.random() * 2000;
      sizes[i] = Math.random() * 2.5;
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    starsGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Responsive radius calculation
    const getResponsiveRadius = () => {
      const width = window.innerWidth;
      if (width <= 768) return 1.8;
      if (width <= 1024) return 2.0;
      return 2.2;
    };

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );

    // Responsive camera position
    const getResponsiveCameraZ = () => {
      const width = window.innerWidth;
      if (width <= 768) return 7;
      if (width <= 1024) return 6;
      return 6.5;
    };

    camera.position.z = getResponsiveCameraZ();

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Label renderer setup
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    labelRenderer.domElement.style.pointerEvents = "none";

    containerRef.current.appendChild(renderer.domElement);
    containerRef.current.appendChild(labelRenderer.domElement);

    // Earth setup with responsive radius
    const radius = getResponsiveRadius();
    const geometry = new THREE.SphereGeometry(radius, 64, 64);

    // Load Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load("/earth-nasa.jpg");
    earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 15,
      bumpMap: earthTexture,
      bumpScale: 0.05,
      specular: new THREE.Color(0x333333),
      specularMap: earthTexture,
    });

    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Add subtle rim lighting
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(-5, 3, -5);
    scene.add(rimLight);

    // Add location markers
    const sprites: THREE.Sprite[] = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    locations.forEach((trip) => {
      const { lat, lng } = trip.location;

      // Convert latitude and longitude to 3D position
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      // Increase offset to 3.5% of radius to ensure markers are clearly above surface
      const markerRadius = radius * 1.035;
      const x = -(markerRadius * Math.sin(phi) * Math.cos(theta));
      const y = markerRadius * Math.cos(phi);
      const z = markerRadius * Math.sin(phi) * Math.sin(theta);

      // Create glow effect using sprite
      const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.TextureLoader().load("/glow.png"),
        color: 0x93b4e0,
        transparent: true,
        opacity: 0.7,
        depthWrite: true,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      // Slightly increase base scale for better visibility
      sprite.scale.set(0.2, 0.2, 1);
      sprite.position.set(x, y, z);
      sprite.userData = { trip }; // Store trip data in the sprite
      earth.add(sprite);
      sprites.push(sprite);

      // Add pulsing animation with adjusted scale range
      const pulseGlow = () => {
        const scale = 0.2 + Math.sin(Date.now() * 0.003) * 0.03;
        sprite.scale.set(scale, scale, 1);
        requestAnimationFrame(pulseGlow);
      };
      pulseGlow();
    });

    // Handle mouse events
    const handleMouseMove = (event: MouseEvent | TouchEvent) => {
      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0].clientY : event.clientY;

      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(sprites);

      if (intersects.length > 0) {
        const hitSprite = intersects[0].object as THREE.Sprite;
        const trip = hitSprite.userData.trip as TripLocation;

        // Increase hover scale proportionally
        hitSprite.scale.set(0.3, 0.3, 1);
        (hitSprite.material as THREE.SpriteMaterial).opacity = 0.9;

        // Reset any existing fade out timer by setting new active location
        setActiveLocation(trip);

        // Adjust card position based on screen width
        const isMobile = window.innerWidth <= 768;
        setCardPosition({
          x: isMobile ? clientX - 140 : clientX + 20,
          y: isMobile ? clientY + 20 : clientY - 20,
        });

        // Reset other sprites with base scale
        sprites.forEach((s) => {
          if (s !== hitSprite) {
            s.scale.set(0.2, 0.2, 1);
            (s.material as THREE.SpriteMaterial).opacity = 0.7;
          }
        });
      } else {
        // Reset all sprites to base scale
        sprites.forEach((sprite) => {
          sprite.scale.set(0.2, 0.2, 1);
          (sprite.material as THREE.SpriteMaterial).opacity = 0.7;
        });
        setIsCardVisible(false);
      }
    };

    const handleClick = (event: MouseEvent | TouchEvent) => {
      event.preventDefault(); // Prevent double-firing on mobile

      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;
      const clientY =
        "touches" in event ? event.touches[0].clientY : event.clientY;

      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(sprites);

      if (intersects.length > 0) {
        const hitSprite = intersects[0].object as THREE.Sprite;
        const trip = hitSprite.userData.trip as TripLocation;
        const isMobile = window.innerWidth <= 768;
        setActiveLocation(trip);
        setCardPosition({
          x: isMobile ? clientX - 140 : clientX + 20,
          y: isMobile ? clientY + 20 : clientY - 20,
        });
      } else {
        setIsCardVisible(false);
      }
    };

    const handleTouchEnd = () => {
      // Don't immediately hide on touch end to allow for reading
      // Instead, start the fade timer
      if (activeLocation) {
        setTimeout(() => {
          setIsCardVisible(false);
        }, 2500); // Match the auto-hide timer duration
      }
    };

    const handleMouseLeave = () => {
      sprites.forEach((sprite) => {
        sprite.scale.set(0.2, 0.2, 1);
        (sprite.material as THREE.SpriteMaterial).opacity = 0.7;
      });
      setIsCardVisible(false);
    };

    containerRef.current.addEventListener(
      "mousemove",
      handleMouseMove as EventListener
    );
    containerRef.current.addEventListener(
      "click",
      handleClick as EventListener
    );
    containerRef.current.addEventListener(
      "touchstart",
      handleClick as EventListener
    );
    containerRef.current.addEventListener(
      "touchmove",
      handleMouseMove as EventListener
    );
    containerRef.current.addEventListener("touchend", handleTouchEnd);
    containerRef.current.addEventListener("mouseleave", handleMouseLeave);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      camera.position.z = getResponsiveCameraZ();
      renderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Update initial camera position and rotation for SEA region
    earth.rotation.y = -(initialRotation[0] * Math.PI) / 180;
    earth.rotation.x = (initialRotation[1] * Math.PI) / 180;

    // Ensure the initial rotation is set before the animation starts
    const targetRotationY = earth.rotation.y;
    earth.rotation.y = targetRotationY;

    // Controls setup with adjusted distances
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.4;
    controls.minDistance = getResponsiveCameraZ() - 2;
    controls.maxDistance = getResponsiveCameraZ() + 6;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = window.innerWidth <= 768 ? 0.4 : 0.6; // rotation speed, adjusted for mobile/desktop

    // Enable controls after animation
    controls.enabled = false;
    setTimeout(() => {
      controls.enabled = true;
    }, 1000); // Longer delay to match slower animation

    // Initial animation setup
    const initialScale = new THREE.Vector3(0.001, 0.001, 0.001);
    earth.scale.copy(initialScale);
    const targetScale = new THREE.Vector3(1, 1, 1);
    let animationProgress = 0;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      // Initial scale-up animation with easing
      if (animationProgress < 1) {
        animationProgress += 0.015; // Slower animation
        const easeOutCubic = 1 - Math.pow(1 - animationProgress, 3); // Smooth easing
        const scale = initialScale.clone().lerp(targetScale, easeOutCubic);
        earth.scale.copy(scale);
      }

      // Update sprite visibility based on camera position
      sprites.forEach((sprite) => {
        const spritePosition = sprite.position.clone();
        const cameraPosition = camera.position.clone();
        const earthPosition = earth.position.clone();

        // Calculate the angle between camera-to-earth center and camera-to-sprite
        const toEarth = earthPosition.sub(cameraPosition).normalize();
        const toSprite = spritePosition.sub(cameraPosition).normalize();
        const angle = toEarth.angleTo(toSprite);

        // Make visibility check more conservative (80 degrees instead of 90)
        const isVisible = angle < (Math.PI / 2) * 0.89;
        sprite.visible = isVisible;
        if (isVisible) {
          const material = sprite.material as THREE.SpriteMaterial;
          material.opacity = 0.7;
        }
      });

      // Slowly rotate stars
      stars.rotation.y += 0.0001;
      stars.rotation.x += 0.0001;

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener(
          "mousemove",
          handleMouseMove as EventListener
        );
        containerRef.current.removeEventListener(
          "click",
          handleClick as EventListener
        );
        containerRef.current.removeEventListener(
          "touchstart",
          handleClick as EventListener
        );
        containerRef.current.removeEventListener(
          "touchmove",
          handleMouseMove as EventListener
        );
        containerRef.current.removeEventListener("touchend", handleTouchEnd);
        containerRef.current.removeEventListener(
          "mouseleave",
          handleMouseLeave
        );
      }
      containerRef.current?.removeChild(renderer.domElement);
      containerRef.current?.removeChild(labelRenderer.domElement);
      scene.clear();
    };
  }, [locations]);

  return (
    <div ref={containerRef} className="earth-container">
      {shouldRenderCard && activeLocation && (
        <TripCard
          trip={activeLocation}
          position={cardPosition}
          onHide={() => setIsCardVisible(false)}
          isVisible={isCardVisible}
        />
      )}
    </div>
  );
}

export default Earth;
