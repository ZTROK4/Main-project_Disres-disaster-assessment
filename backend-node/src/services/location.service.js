const axios = require("axios");

exports.getPlaceNameFromCoordinates = async (latitude, longitude) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: apiKey,
        },
      }
    );

    if (
      !response.data.results ||
      response.data.results.length === 0
    ) {
      return "Unknown location";
    }

    // Get formatted address
    const formattedAddress = response.data.results[0].formatted_address;

    return formattedAddress;

  } catch (error) {
    console.error("Reverse geocoding failed:", error.message);
    return "Location unavailable";
  }
};