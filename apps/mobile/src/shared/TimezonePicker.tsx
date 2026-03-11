import { useState } from "react";
import { Pressable, Text } from "react-native";
import { PickerModal } from "./PickerModal";

// Use dates in Jan and Jul to capture both standard and daylight abbreviations
const JAN = new Date(2026, 0, 15);
const JUL = new Date(2026, 6, 15);

function tzName(
  tz: string,
  date: Date,
  style: "shortOffset" | "short",
): string {
  try {
    return (
      new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: style })
        .formatToParts(date)
        .find((p) => p.type === "timeZoneName")?.value ?? ""
    );
  } catch {
    return "";
  }
}

function tzMeta(tz: string): { offset: string; abbrs: string[] } {
  const offset = tzName(tz, new Date(), "shortOffset");
  const abbrJan = tzName(tz, JAN, "short");
  const abbrJul = tzName(tz, JUL, "short");
  const abbrs = [...new Set([abbrJan, abbrJul].filter(Boolean))];
  return { offset, abbrs };
}

function formatTzLabel(tz: string): string {
  const parts = tz.split("/");
  const city = (parts.pop() ?? tz).replaceAll("_", " ");
  const region = parts.join("/").replaceAll("_", " ");
  return region ? `${city}, ${region}` : city;
}

const timezoneOptions = Intl.supportedValuesOf("timeZone").map((tz) => {
  const { offset, abbrs } = tzMeta(tz);
  return {
    value: tz,
    label: formatTzLabel(tz),
    subtitle: offset,
    searchTerms: [tz.replaceAll("_", " "), ...abbrs, offset]
      .filter(Boolean)
      .join(" "),
  };
});

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
          {value ? formatTzLabel(value) : placeholder}
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
