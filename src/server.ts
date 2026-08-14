import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import { env } from "./config/env";
import { connectDatabase } from "./db";
import passport from "./auth/passport";
import webRouter from "./routes/web";

async function bootstrap() {
  await connectDatabase();

  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(process.cwd(), "src", "views"));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(process.cwd(), "src", "public")));

  app.use(
    session({
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: env.mongoUri,
      }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(webRouter);

  app.use((_req, res) => {
    res.status(404).render("not-found", { title: "Not Found" });
  });

  app.listen(env.port, () => {
    console.log(`GitIntent app running at ${env.baseUrl}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start app", error);
  process.exit(1);
});
