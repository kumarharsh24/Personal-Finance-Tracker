const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./db');

// Serialize user into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db('users').where({ id }).first();
    if (user) {
      delete user.password_hash;
    }
    done(null, user || false);
  } catch (err) {
    done(err, false);
  }
});

// Local Strategy (email + password)
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await db('users')
          .where({ email: email.toLowerCase().trim() })
          .first();

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.password_hash) {
          return done(null, false, {
            message: 'This account uses Google sign-in. Please login with Google.',
          });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        delete user.password_hash;
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Google OAuth Strategy (only if credentials are configured)
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id'
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          'http://localhost:3000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value.toLowerCase();

          // Check if user exists by google_id
          let user = await db('users').where({ google_id: profile.id }).first();

          if (user) {
            delete user.password_hash;
            return done(null, user);
          }

          // Check if user exists by email (link accounts)
          user = await db('users').where({ email }).first();

          if (user) {
            // Link Google account to existing user
            await db('users')
              .where({ id: user.id })
              .update({ google_id: profile.id, updated_at: new Date() });
            user.google_id = profile.id;
            delete user.password_hash;
            return done(null, user);
          }

          // Create new user
          const [newUser] = await db('users')
            .insert({
              email,
              name: profile.displayName || '',
              google_id: profile.id,
              preferred_currency: 'USD',
            })
            .returning('*');

          // Seed default categories for new user
          const { seedDefaultCategories } = require('../services/categoryService');
          await seedDefaultCategories(newUser.id);

          delete newUser.password_hash;
          return done(null, newUser);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

module.exports = passport;
