const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // Guardamos solo lo mínimo en sesión (mejor para el proyecto)
      const user = {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        profileUrl: profile.profileUrl,
      };

      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  // Se guarda esto en la sesión
  done(null, user);
});

passport.deserializeUser((user, done) => {
  // Se recupera de la sesión
  done(null, user);
});
