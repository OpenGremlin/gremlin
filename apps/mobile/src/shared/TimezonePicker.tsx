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

function getTimezones(): string[] {
  if (
    typeof Intl !== "undefined" &&
    typeof Intl.supportedValuesOf === "function"
  ) {
    return Intl.supportedValuesOf("timeZone");
  }
  // Hermes doesn't support Intl.supportedValuesOf — use a common subset
  return [
    "Africa/Cairo", "Africa/Casablanca", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
    "America/Anchorage", "America/Argentina/Buenos_Aires", "America/Bogota", "America/Chicago",
    "America/Denver", "America/Halifax", "America/Lima", "America/Los_Angeles", "America/Mexico_City",
    "America/New_York", "America/Phoenix", "America/Santiago", "America/Sao_Paulo", "America/St_Johns",
    "America/Toronto", "America/Vancouver",
    "Asia/Bangkok", "Asia/Colombo", "Asia/Dhaka", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Jakarta",
    "Asia/Karachi", "Asia/Kathmandu", "Asia/Kolkata", "Asia/Kuala_Lumpur", "Asia/Manila",
    "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei", "Asia/Tehran", "Asia/Tokyo",
    "Atlantic/Reykjavik",
    "Australia/Melbourne", "Australia/Perth", "Australia/Sydney",
    "Europe/Amsterdam", "Europe/Athens", "Europe/Berlin", "Europe/Brussels", "Europe/Dublin",
    "Europe/Helsinki", "Europe/Istanbul", "Europe/Lisbon", "Europe/London", "Europe/Madrid",
    "Europe/Moscow", "Europe/Paris", "Europe/Rome", "Europe/Stockholm", "Europe/Vienna", "Europe/Warsaw", "Europe/Zurich",
    "Pacific/Auckland", "Pacific/Fiji", "Pacific/Guam", "Pacific/Honolulu",
    "UTC",
  ];
}

const timezoneOptions = getTimezones().map((tz) => {
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
          "bg-surface-alt rounded-lg px-3 py-2.5 border border-app-border"
        }
        onPress={() => setOpen(true)}
      >
        <Text
          className={`text-sm ${value ? "text-text-primary" : "text-text-muted"}`}
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
