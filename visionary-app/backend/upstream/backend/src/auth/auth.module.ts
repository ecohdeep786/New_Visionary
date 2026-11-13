import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { EmailModule } from "../email/email.module";
import { FirebaseAdminModule } from "./firebase/firebase-admin.module";

/* Intentional upstream patch (FAP-67, 2026-11-04): the Google OAuth strategy
   is registered only when its client credentials are configured. Without
   this guard a missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET crashed the
   whole boot at the passport strategy constructor, taking email/password
   auth down with it. With the guard, the backend boots and serves the email
   path; the Google endpoints stay unavailable until the founder adds the
   OAuth credentials. Recorded per the AGENTS.md upstream-patch rule. */
const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

@Module({
  imports: [
    FirebaseAdminModule,
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_SECRET"),
        signOptions: { expiresIn: config.get("JWT_EXPIRES_IN") || "7d" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...(googleConfigured ? [GoogleStrategy] : [])],
  exports: [AuthService, JwtModule, FirebaseAdminModule],
})
export class AuthModule {}
