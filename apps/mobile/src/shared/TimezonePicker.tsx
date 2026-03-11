import { useState } from "react";
import { Pressable, Text } from "react-native";
import { PickerModal } from "./PickerModal";

const timezoneOptions = Intl.supportedValuesOf("timeZone").map((tz) => ({
  value: tz,
  label: tz.replaceAll("_", " "),
}));

export function TimezonePicker({
  value,
  onChange,
  placeholder = "Select timezone",
  className,
}: {
  value: string;
  onChange: (tz: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        className={
          className ??
          "bg-neutral-800 rounded-lg px-3 py-2.5 border border-neutral-700"
        }
        onPress={() => setOpen(true)}
      >
        <Text
          className={`text-sm ${value ? "text-neutral-100" : "text-neutral-500"}`}
        >
          {value ? value.replaceAll("_", " ") : placeholder}
        </Text>
      </Pressable>
      <PickerModal
        visible={open}
        title="Select Timezone"
        options={timezoneOptions}
        selected={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
        searchable
      />
    </>
  );
}
