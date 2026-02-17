// test-db.js
const prisma = require("./src/db/prisma");

async function test() {
  const project = await prisma.project.create({
    data: {
      location: "Test Location",
      disasterType: "fire"
    }
  });

  console.log(project);
}

test();
