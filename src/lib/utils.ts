export function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export const localStorageKeys = {
  DARK_MODE: 'DARK_MODE',
};
