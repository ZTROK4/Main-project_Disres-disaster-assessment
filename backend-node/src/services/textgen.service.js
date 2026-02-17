const axios = require("axios");

exports.generateTextReport = async (payload, { onToken }) => {
  const response = await axios.post(
    process.env.TEXTGEN_API_URL + "/textgen/report",
    payload,
    {
      responseType: "stream",
      timeout: 0, // no axios timeout for streaming
    }
  );

  let fullText = "";

  return new Promise((resolve, reject) => {
    response.data.on("data", (chunk) => {
      try {
        const text = chunk.toString();
        fullText += text;

        // 🔴 stream tokens upstream
        onToken?.(text);
      } catch (err) {
        reject(err);
      }
    });

    response.data.on("end", () => {
      resolve({ fullText });
    });

    response.data.on("error", (err) => {
      reject(err);
    });
  });
};
