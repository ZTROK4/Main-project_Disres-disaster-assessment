require("dotenv").config();
const { server } = require("./app");

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Node server running on port ${PORT}`);
});