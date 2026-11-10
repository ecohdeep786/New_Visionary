// Apply before archive creation: ignored or accidentally tracked local settings
// must never become source uploads through an otherwise allowed directory.
export const blockedReleasePath = file => /(^|\/)(?:\.env[^/]*|node_modules|artifacts|credentials)(?:\/|$)|(^|\/)[^/]*service-account[^/]*\.json$|\.(?:pem|key|p12|pfx)$/i.test(file);
