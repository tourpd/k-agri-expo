export function resolveLink(linkType: string, linkValue: string | null) {
  switch (linkType) {
    case "booth":
      return `/expo/booths/${linkValue}`;

    case "deal":
      return `/expo/deals/${linkValue}`;

    case "hall":
      return `/expo/hall/${linkValue}`;

    case "event":
      return linkValue || "/expo/event";

    case "live":
      return linkValue || "/expo/live";

    case "external":
      return linkValue || "/expo";

    case "custom":
    default:
      return linkValue || "/expo";
  }
}