export function getNavbarSearchPlaceholder(role?: string | null) {
    return role === "buyer"
        ? "Search crops or districts..."
        : "Search transactions...";
}