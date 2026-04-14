import type { AppUserRole } from "./get-user-role";

export function getDashboardPath(role: AppUserRole) {
  switch (role) {
    case "admin":
      return "/expo/admin";
    case "vendor":
      return "/vendor/dashboard";
    case "buyer":
      return "/buyer/dashboard";
    case "farmer":
      return "/farmer/dashboard";
    default:
      return "/login";
  }
}