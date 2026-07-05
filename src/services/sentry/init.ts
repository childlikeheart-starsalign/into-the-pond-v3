import * as Sentry from "@sentry/react-native";

import { env } from "@/src/config/env";

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
      return event;
    },
  });
}

export { Sentry };
