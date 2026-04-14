import { requireRole } from "./requireRole";

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireVendor() {
  return requireRole(["vendor"]);
}

export async function requireFarmer() {
  return requireRole(["farmer"]);
}

export async function requireBuyer() {
  return requireRole(["buyer"]);
}

export async function requireSignedInUser() {
  return requireRole(["admin", "vendor", "farmer", "buyer"]);
}