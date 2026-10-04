import { useEffect, useMemo, useRef, useState } from "react";

import { Alert, Platform } from "react-native";

import {
  AccessTokenRequest,
  makeRedirectUri,
  ResponseType,
  TokenResponse,
  useAuthRequest,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { useOnboarding } from "../context/OnboardingContext";
import {
  CALENDAR_FREEBUSY_SCOPE,
  ensureFreshSession,
  googleClientId,
  googleDiscovery,
  iosGoogleRedirectUri,
  loadUpcomingFreeBlocks,
  sessionFromToken,
} from "../services/googleCalendar";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleCalendarConnect() {
  const { calendarSession, saveCalendarAvailability } =
    useOnboarding();

  const clientId = googleClientId();
  const redirectUri = useMemo(() => {
    if (Platform.OS === "ios") {
      return (
        iosGoogleRedirectUri(clientId) ??
        makeRedirectUri({
          scheme: "umdiningtracker",
          path: "oauth2redirect",
        })
      );
    }

    return makeRedirectUri({
      scheme: "umdiningtracker",
      path: "oauth2redirect",
    });
  }, [clientId]);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: [CALENDAR_FREEBUSY_SCOPE],
      responseType:
        Platform.OS === "web" ? ResponseType.Token : ResponseType.Code,
      usePKCE: Platform.OS !== "web",
      extraParams:
  Platform.OS === "web"
    ? undefined
    : {
        access_type: "offline",
        prompt:
          "select_account consent",
      },
    },
    googleDiscovery
  );

  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!response || response.type === "opened") {
      return;
    }

    if (
      response.type === "cancel" ||
      response.type === "dismiss" ||
      response.type === "locked"
    ) {
      setConnecting(false);
      return;
    }

    if (response.type === "error") {
      setConnecting(false);
      const detail =
        response.params.error_description || response.params.error;
      const message = detail
        ? `Google Calendar didn't connect. ${detail}`
        : "Google Calendar didn't connect.";
      setNotice(message);
      Alert.alert("Google Calendar", message);
      return;
    }

    if (response.type !== "success") {
      setConnecting(false);
      return;
    }

    const success = response;
    const existingToken = success.authentication?.accessToken;
    const code = success.params.code;
    const key = existingToken ?? success.params.access_token ?? code;

    if (!key || handled.current === key) {
      return;
    }

    let cancelled = false;

    async function finishConnection() {
      try {
        let authentication = success.authentication;

        if (!authentication && success.params.access_token) {
          authentication = TokenResponse.fromQueryParams(success.params);
        }

        if (!authentication && success.params.code) {
          authentication = await new AccessTokenRequest({
            clientId,
            redirectUri,
            code: success.params.code,
            extraParams: {
              code_verifier: request?.codeVerifier ?? "",
            },
          }).performAsync(googleDiscovery);
        }

        if (!authentication?.accessToken) {
          throw new Error("Missing access token.");
        }

        const blocks = await loadUpcomingFreeBlocks(
          authentication.accessToken
        );

        if (cancelled) {
          return;
        }

        handled.current = key ?? null;
        setNotice(null);
        saveCalendarAvailability(
          sessionFromToken(authentication, clientId),
          blocks
        );
      } catch {
        if (!cancelled) {
          const message = "Couldn't read your free time. Nothing was saved.";
          setNotice(message);
          Alert.alert("Google Calendar", message);
        }
      } finally {
        if (!cancelled) {
          setConnecting(false);
        }
      }
    }

    void finishConnection();

    return () => {
      cancelled = true;
    };
  }, [
    clientId,
    redirectUri,
    request,
    response,
    saveCalendarAvailability,
  ]);

  async function connect() {
    if (!clientId) {
      const message =
        Platform.OS === "ios"
          ? "Add the iOS Google client ID, then restart Expo so the app can read it."
          : "Google Calendar connects on the iOS app with the iOS client ID.";
      setNotice(message);
      Alert.alert("Google Calendar", message);
      return;
    }

    setNotice(null);

    if (calendarSession) {
      setConnecting(true);

      try {
        const fresh = await ensureFreshSession(calendarSession);
        const blocks = await loadUpcomingFreeBlocks(fresh.accessToken);
        saveCalendarAvailability(fresh, blocks);
        return;
      } catch {
        // The saved token can no longer read availability.
        // Fall through and ask Google again.
      } finally {
        setConnecting(false);
      }
    }

    if (!request) {
      const message = "Google sign-in is still loading. Try again in a moment.";
      setNotice(message);
      return;
    }

    setConnecting(true);
    const result = await promptAsync();

    if (result.type !== "success") {
      setConnecting(false);
    }
  }
  async function refetch() {
  if (!clientId) {
    const message =
      Platform.OS === "ios"
        ? "Add the iOS Google client ID, then restart Expo so the app can read it."
        : "Google Calendar connects on the iOS app with the iOS client ID.";

    setNotice(message);

    Alert.alert(
      "Google Calendar",
      message
    );

    return;
  }

  if (!request) {
    const message =
      "Google sign-in is still loading. Try again in a moment.";

    setNotice(message);

    return;
  }

  /*
   * Don't reuse calendarSession here.
   *
   * Refetch should deliberately open
   * Google's authentication flow again.
   */
  setNotice(null);

  /*
   * Allow the next successful OAuth
   * response to be handled.
   */
  handled.current = null;

  setConnecting(true);

  const result =
    await promptAsync();

  if (
    result.type !== "success"
  ) {
    setConnecting(false);
  }
}

  return {
  connect,
  refetch,
  connecting,
  notice,
};
}
