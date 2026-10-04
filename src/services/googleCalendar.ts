import { Platform } from "react-native";

import {
  DiscoveryDocument,
  TokenResponse,
} from "expo-auth-session";

import { CalendarSession } from "../types/CalendarSession";
import { FreeTimeBlock } from "../types/UserProfile";
import {
  endOfLocalDay,
  freeBlocksFromBusy,
} from "../utils/freeTime";

export const CALENDAR_FREEBUSY_SCOPE =
  "https://www.googleapis.com/auth/calendar.freebusy";

const GOOGLE_CLIENT_SUFFIX = ".apps.googleusercontent.com";

/**
 * Google iOS clients only accept this reversed-client redirect.
 * Example client `123-abc.apps.googleusercontent.com` redirects to
 * `com.googleusercontent.apps.123-abc:/oauth2redirect`.
 */
export function reversedIosClientScheme(clientId: string): string | null {
  if (!clientId.endsWith(GOOGLE_CLIENT_SUFFIX)) {
    return null;
  }

  const prefix = clientId.slice(0, -GOOGLE_CLIENT_SUFFIX.length);

  if (!prefix) {
    return null;
  }

  return `com.googleusercontent.apps.${prefix}`;
}

export function iosGoogleRedirectUri(clientId: string): string | null {
  const scheme = reversedIosClientScheme(clientId);

  if (!scheme) {
    return null;
  }

  return `${scheme}:/oauth2redirect`;
}

export const googleDiscovery: DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

type BusyInterval = {
  start: string;
  end: string;
};

type FreeBusyResponse = {
  calendars?: Record<
    string,
    {
      busy?: BusyInterval[];
      errors?: { reason?: string }[];
    }
  >;
};

export function googleClientId(): string {
  const platformId = Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  return (
    platformId ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  );
}

export function sessionFromToken(
  authentication: TokenResponse,
  clientId: string
): CalendarSession {
  return {
    accessToken: authentication.accessToken,
    refreshToken: authentication.refreshToken,
    expiresIn:
      authentication.expiresIn == null
        ? undefined
        : Number(authentication.expiresIn),
    issuedAt: authentication.issuedAt,
    clientId,
  };
}

export async function ensureFreshSession(
  session: CalendarSession
): Promise<CalendarSession> {
  const token = new TokenResponse({
    accessToken: session.accessToken,
    tokenType: "bearer",
    refreshToken: session.refreshToken,
    expiresIn: session.expiresIn,
    issuedAt: session.issuedAt,
  });

  if (!token.shouldRefresh()) {
    return session;
  }

  const refreshed = await token.refreshAsync(
    { clientId: session.clientId },
    googleDiscovery
  );

  return sessionFromToken(refreshed, session.clientId);
}

/**
 * Read availability for the rest of today and keep only free
 * blocks of at least one hour. Event details are never stored.
 */
export async function loadUpcomingFreeBlocks(
  accessToken: string,
  now = new Date()
): Promise<FreeTimeBlock[]> {
  const timeMax = endOfLocalDay(now);
  const busy = await fetchBusyIntervals(accessToken, now, timeMax);
  return freeBlocksFromBusy(now, timeMax, busy);
}

async function fetchBusyIntervals(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<BusyInterval[]> {
  if (timeMax.getTime() <= timeMin.getTime()) {
    return [];
  }

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: "primary" }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Google Calendar availability request failed (${response.status}).`
    );
  }

  const data = (await response.json()) as FreeBusyResponse;
  const primary = data.calendars?.primary;

  if (!primary || primary.errors?.length) {
    throw new Error(
      "Google Calendar availability was not available."
    );
  }

  return primary.busy ?? [];
}
