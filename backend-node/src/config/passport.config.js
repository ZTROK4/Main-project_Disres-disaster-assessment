const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const prisma = require("../prisma") // your prisma instance
const jwt = require("jsonwebtoken")

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value

        let user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              googleId: profile.id
            }
          })
        }

        return done(null, user)

      } catch (err) {
        return done(err, null)
      }
    }
  )
)

module.exports = passport