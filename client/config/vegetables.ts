export type VegetableConfig = {
  name: string;
  coldStorageCrop: true;
  recommendedStorage: string;
};

export const coldStorageVegetables: Record<string, VegetableConfig> = {
  tomato: { name: "Tomato", coldStorageCrop: true, recommendedStorage: "7–15°C" },
  carrot: { name: "Carrot", coldStorageCrop: true, recommendedStorage: "0–5°C" },
  broccoli: { name: "Broccoli", coldStorageCrop: true, recommendedStorage: "0°C" },
  potato: { name: "Potato", coldStorageCrop: true, recommendedStorage: "7°C" },
  cucumber: { name: "Cucumber", coldStorageCrop: true, recommendedStorage: "10–12.5°C" },
  cauliflower: { name: "Cauliflower", coldStorageCrop: true, recommendedStorage: "0°C" },
  cabbage: { name: "Cabbage", coldStorageCrop: true, recommendedStorage: "0°C" },
  pumpkin: { name: "Pumpkin", coldStorageCrop: true, recommendedStorage: "10°C" },
  bean: { name: "Bean", coldStorageCrop: true, recommendedStorage: "4–7°C" },
  papaya: { name: "Papaya", coldStorageCrop: true, recommendedStorage: "10–13°C" },
  bitterGourd: { name: "Bitter Gourd", coldStorageCrop: true, recommendedStorage: "10–12°C" },
  bottleGourd: { name: "Bottle Gourd", coldStorageCrop: true, recommendedStorage: "10–12°C" },
  brinjal: { name: "Brinjal", coldStorageCrop: true, recommendedStorage: "10–12°C" },
  capsicum: { name: "Capsicum", coldStorageCrop: true, recommendedStorage: "7–10°C" },
  radish: { name: "Radish", coldStorageCrop: true, recommendedStorage: "0–2°C" },
};

const normalizeClassName = (name: string) => name.toLowerCase().replace(/[ _]/g, "");

export function getVegetableConfig(name: string) {
  return Object.values(coldStorageVegetables).find(
    (vegetable) => normalizeClassName(vegetable.name) === normalizeClassName(name),
  );
}
