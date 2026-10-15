import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { App, applicationDefault, cert, deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";

export class FirebaseAdminConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseAdminConfigurationError";
  }
}

export function firebaseAdminSettings(config: ConfigService) {
  const projectId = config.get<string>("FIREBASE_PROJECT_ID");
  if (typeof projectId !== "string" || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) {
    throw new FirebaseAdminConfigurationError("Set a valid FIREBASE_PROJECT_ID before using Firebase Admin.");
  }
  const kind = config.get<string>("FIREBASE_PROJECT_KIND") || "production";
  if (!["production", "staging", "emulator"].includes(kind)) {
    throw new FirebaseAdminConfigurationError("FIREBASE_PROJECT_KIND must be production, staging or emulator.");
  }
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || config.get<string>("FIREBASE_AUTH_EMULATOR_HOST");
  if (emulatorHost) {
    if (kind !== "emulator" || !projectId.startsWith("demo-") || config.get("NODE_ENV") === "production") {
      throw new FirebaseAdminConfigurationError("Auth Emulator configuration cannot be used with a live project or production runtime.");
    }
    const match = /^(?:localhost|127\.0\.0\.1|\[::1\]):(\d{1,5})$/.exec(emulatorHost);
    if (!match || Number(match[1]) < 1 || Number(match[1]) > 65535) {
      throw new FirebaseAdminConfigurationError("Auth Emulator must use an explicit loopback host and valid port.");
    }
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== emulatorHost) {
      throw new FirebaseAdminConfigurationError("Auth Emulator host must be set in the process environment before Admin initialization.");
    }
  } else if (kind === "emulator") {
    throw new FirebaseAdminConfigurationError("Emulator mode requires FIREBASE_AUTH_EMULATOR_HOST; live fallback is prohibited.");
  }
  const credentialFile = config.get<string>("GOOGLE_APPLICATION_CREDENTIALS");
  if (credentialFile && !isAbsolute(credentialFile)) {
    throw new FirebaseAdminConfigurationError("GOOGLE_APPLICATION_CREDENTIALS must be an absolute local file path.");
  }
  if (kind === "emulator" && credentialFile) {
    throw new FirebaseAdminConfigurationError("Emulator mode must not load a production credential file.");
  }
  return { projectId, kind, emulatorHost, credentialFile };
}

@Injectable()
export class FirebaseAdminService implements OnModuleDestroy {
  private app?: App;
  private ownsApp = false;
  private binding?: string;

  constructor(private readonly config: ConfigService) {}

  // Lazy: importing/injecting this provider does not read a key or contact Firebase.
  getAuth(): Auth {
    const settings = firebaseAdminSettings(this.config);
    const binding = JSON.stringify([settings.projectId, settings.kind, settings.emulatorHost || null, settings.credentialFile || null]);
    if (this.app) {
      if (this.binding !== binding) {
        throw new FirebaseAdminConfigurationError("Firebase configuration changed; restart the backend before continuing.");
      }
      return getAuth(this.app);
    }
    const name = "visionary-backend-auth";
    const existing = getApps().find(app => app.name === name);
    if (existing) {
      throw new FirebaseAdminConfigurationError("Firebase Admin was initialized outside this provider; restart and use the shared provider.");
    }
    let credential;
    if (settings.kind !== "emulator" && settings.credentialFile) {
      let account;
      try { account = JSON.parse(readFileSync(settings.credentialFile, "utf8")); }
      catch { throw new FirebaseAdminConfigurationError("The Firebase credential file is unreadable or invalid JSON."); }
      if (account.type !== "service_account" || account.project_id !== settings.projectId) {
        throw new FirebaseAdminConfigurationError("The service-account credential does not match the configured Firebase project.");
      }
      if (typeof account.private_key !== "string" || typeof account.client_email !== "string" || !account.private_key_id) {
        throw new FirebaseAdminConfigurationError("Required service-account credential fields are missing.");
      }
      try { credential = cert(account); }
      catch { throw new FirebaseAdminConfigurationError("The Firebase service-account credential cannot be parsed."); }
    } else if (settings.kind === "emulator") {
      // No live key/ADC discovery, even if the surrounding host has credentials.
      credential = { getAccessToken: async () => ({ access_token: "emulator-only", expires_in: 3600 }) };
    } else {
      credential = applicationDefault();
    }
    this.app = initializeApp({ projectId: settings.projectId, credential }, name);
    this.ownsApp = true;
    this.binding = binding;
    return getAuth(this.app);
  }

  async onModuleDestroy() {
    if (this.ownsApp && this.app) await deleteApp(this.app);
    this.app = undefined;
    this.ownsApp = false;
    this.binding = undefined;
  }
}
