const integerFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0
});

const oneDecimalFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export function formatKilometers(value, digits = 1) {
  const numeric = Number(value) || 0;
  if (digits <= 0) {
    return integerFormatter.format(numeric);
  }
  return oneDecimalFormatter.format(numeric);
}

export function formatMeters(value) {
  return integerFormatter.format(Number(value) || 0);
}