const { loadProjectEnv } = require("@expo/env");

loadProjectEnv(__dirname);

const GOOGLE_CLIENT_SUFFIX = ".apps.googleusercontent.com";

function reversedIosClientScheme(clientId) {
  if (!clientId || !clientId.endsWith(GOOGLE_CLIENT_SUFFIX)) {
    return null;
  }

  const prefix = clientId.slice(0, -GOOGLE_CLIENT_SUFFIX.length);

  if (!prefix) {
    return null;
  }

  return `com.googleusercontent.apps.${prefix}`;
}

module.exports = ({ config }) => {
  const googleScheme = reversedIosClientScheme(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  );

  const scheme = [
    ...new Set(
      [config.scheme, googleScheme].flat().filter(Boolean)
    ),
  ];

  return {
    ...config,
    scheme,
    ios: {
      ...config.ios,
      bundleIdentifier: "com.anev.umdiningtracker",
    },
  };
};
