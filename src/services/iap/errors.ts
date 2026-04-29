export function getPurchaseErrorMessage(error: unknown) {
  const text = String(error ?? "");
  const normalized = text.toLowerCase();

  if (normalized.includes("cancel")) {
    return "Purchase cancelled - you can try again anytime.";
  }
  if (normalized.includes("network") || normalized.includes("payment") || normalized.includes("fund")) {
    return "Payment failed. Please check your payment method.";
  }
  if (normalized.includes("verify")) {
    return "We could not verify your purchase. Please contact support.";
  }
  if (normalized.includes("active") || normalized.includes("already")) {
    return "Your subscription is active. Restoring...";
  }
  return "Purchase failed. Please try again.";
}

