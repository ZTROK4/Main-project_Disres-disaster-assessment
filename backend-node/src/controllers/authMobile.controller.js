const { OAuth2Client } = require("google-auth-library");
const prisma = require("../db/prisma");
const authService = require("../services/auth.service");

const client = new OAuth2Client(process.env.GOOGLE_ANDROID_CLIENT_ID);

exports.mobileGoogleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log("authgoogle ran");
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_ANDROID_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name;
    const googleId = payload.sub;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
        },
      });
    }

    const token = authService.generateUserToken(user);

    res.json({
      token,
      isNewUser,
      user,
    });

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Google authentication failed" });
  }
};