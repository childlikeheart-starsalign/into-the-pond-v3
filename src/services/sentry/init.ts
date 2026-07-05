import * as Sentry from "@sentry/react-native";

import { env } from "@/src/config/env";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function redactEmails(text: string | undefined): string | undefined {
  if (!text) return text;
  return text.replace(EMAIL_RE, "[email]");
}

const dsn = env.sentry.dsn;
if (dsn) {
  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.2,
    beforeSend(event) {
      if (event.user?.email) delete event.user.email;
      event.breadcrumbs?.forEach((b) => {
        if (b.message && /@/.test(b.message)) b.message = "[redacted]";
      });
      if (event.message) {
        event.message = redactEmails(event.message);
      }
      event.exception?.values?.forEach((ex) => {
        if (ex.value) ex.value = redactEmails(ex.value) ?? ex.value;
      });
      return event;
    },
  });
}

export { Sentry };
