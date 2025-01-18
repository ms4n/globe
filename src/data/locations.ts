interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface TripLocation {
  title: string;
  location: Location;
  host: {
    name: string;
    image: string;
  };
  slug: string;
}

// Trip data from API with coordinates
export const tripLocations: TripLocation[] = [
  {
    title: "Epic Europe With Khushbu",
    location: {
      name: "Europe",
      lat: 48.8566,
      lng: 2.3522,
    },
    host: {
      name: "Khushbu Shah",
      image:
        "https://supersquad.blob.core.windows.net/trip-assets/image/45dec4f8.jpeg",
    },
    slug: "epic-europe",
  },
  {
    title: "Thailand with Komal",
    location: {
      name: "Thailand",
      lat: 15.87,
      lng: 100.9925,
    },
    host: {
      name: "Komal Maheshwari",
      image:
        "https://supersquad.blob.core.windows.net/trip-assets/image/e1c8674b.jpeg",
    },
    slug: "thailand-with-komal",
  },
  {
    title: "Peakfit Retreat with Sid and Vera",
    location: {
      name: "Manali",
      lat: 32.2432,
      lng: 77.1892,
    },
    host: {
      name: "Siddhartha & Vera",
      image:
        "https://supersquad.blob.core.windows.net/trip-assets/image/e5e653be.webp",
    },
    slug: "peakfit-retreat-with-sid-and-vera",
  },
  {
    title: "The Founder's Camp With Arihant, Jaidev & Vivek",
    location: {
      name: "Kainchi Dhaam (Bhimtal)",
      lat: 29.3803,
      lng: 79.5556,
    },
    host: {
      name: "Arihant, Jaidev & Vivek",
      image:
        "https://supersquad.blob.core.windows.net/trip-assets/image/45a10b17.jpeg",
    },
    slug: "the-founders-camp-with-arihant-jaidev-and-vivek",
  },
  {
    title: "Bali Escape with Garima",
    location: {
      name: "Bali",
      lat: -8.3405,
      lng: 115.092,
    },
    host: {
      name: "Garima Vardhan",
      image:
        "https://supersquad.blob.core.windows.net/trip-assets/image/a542d33c.webp",
    },
    slug: "bali-escape-with-garima",
  },
  {
    title: "The Pole Camp Vietnam Chapter",
    location: {
      name: "Vietnam",
      lat: 14.0583,
      lng: 108.2772,
    },
    host: {
      name: "Anusha Swamy",
      image:
        "https://supersquad.blob.core.windows.net/trip-assets/image/f119eaa0.jpeg",
    },
    slug: "the-polecamp-vietnam-edition-5day",
  },
];

export default tripLocations;
