const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function findNearest(type, latitude, longitude) {
  try {
    const url = "https://places.googleapis.com/v1/places:searchNearby";

    const response = await axios.post(
      url,
      {
        includedTypes: [type],
        maxResultCount: 1,
        locationRestriction: {
          circle: {
            center: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            },
            radius: 5000.0, // 5km radius
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.id"
        },
        timeout: 5000 // prevent hanging requests
      }
    );

    const place = response.data?.places?.[0];

    if (!place) return null;

    return {
      name: place.displayName?.text || null,
      address: place.formattedAddress || null,
      phone: place.nationalPhoneNumber || null,
      placeId: place.id || null
    };

  } catch (error) {
    console.error(`Google Places error for type ${type}:`, error.response?.data || error.message);
    return null; // fail gracefully
  }
}

exports.resolveNearestAuthorities = async (latitude, longitude) => {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY not set in environment");
  }

  const [police, hospital, fire] = await Promise.all([
    findNearest("police", latitude, longitude),
    findNearest("hospital", latitude, longitude),
    findNearest("fire_station", latitude, longitude),
  ]);

  return { police, hospital, fire };
};