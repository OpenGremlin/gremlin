import { Image, type ImageProps } from "expo-image";
import { useState } from "react";
import { View } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { DelayedSpinner } from "./DelayedSpinner";

type AuthImageProps = Omit<ImageProps, "source"> & {
  uri: string;
};

/**
 * Image component that attaches the current bearer token as an Authorization
 * header. Use this for any image loaded from authenticated endpoints
 * (e.g. /api/files/*). Public images (e.g. /media/*) can use Image directly.
 */
export function AuthImage({ uri, style, ...props }: AuthImageProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);

  return (
    <View style={[{ position: "relative" }, style]}>
      {loading && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DelayedSpinner />
        </View>
      )}
      <Image
        source={{
          uri,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }}
        style={{ width: "100%", height: "100%" }}
        onLoad={() => setLoading(false)}
        {...props}
      />
    </View>
  );
}
