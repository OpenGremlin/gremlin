import { AlertCircle } from "lucide-react-native";
import { Text, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { Button } from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const colors = useNavigationTheme();

  return (
    <View className="items-center py-16 px-8">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-error-surface">
        <AlertCircle size={22} color={colors.error} />
      </View>
      <Text className="text-text-secondary text-base font-medium text-center">
        Something went wrong
      </Text>
      <Text className="text-text-muted text-sm text-center mt-1.5 max-w-[280px]">
        {message}
      </Text>
      {onRetry && (
        <View className="mt-4">
          <Button variant="secondary" onPress={() => onRetry?.()}>
            Try again
          </Button>
        </View>
      )}
    </View>
  );
}
