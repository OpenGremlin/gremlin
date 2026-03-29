import { Image, type ImageProps } from "expo-image";
import { useAuth } from "../lib/AuthContext";

type AuthImageProps = Omit<ImageProps, "source"> & {
  uri: string;
};

/**
 * Image component that attaches the current bearer token as an Authorization
 * header. Use this for any image loaded from authenticated endpoints
 * (e.g. /api/files/*). Public images (e.g. /media/*) can use Image directly.
 */
export function AuthImage({ uri, ...props }: AuthImageProps) {
  const { token } = useAuth();

  return (
    <Image
      source={{
        uri,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }}
      {...props}
    />
  );
}
