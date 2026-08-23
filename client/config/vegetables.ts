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
  onion: { name: "Onion", coldStorageCrop: true, recommendedStorage: "4–5°C" },
  cucumber: { name: "Cucumber", coldStorageCrop: true, recommendedStorage: "10–12.5°C" },
  cabbage: { name: "Cabbage", coldStorageCrop: true, recommendedStorage: "0°C" },
  mushroom: { name: "Mushroom", coldStorageCrop: true, recommendedStorage: "0–4°C" },
  eggplant: { name: "Eggplant", coldStorageCrop: true, recommendedStorage: "10–12.5°C" },
  lettuce: { name: "Lettuce", coldStorageCrop: true, recommendedStorage: "0–2°C" },
  garlic: { name: "Garlic", coldStorageCrop: true, recommendedStorage: "0–4°C" },
  pepper: { name: "Pepper", coldStorageCrop: true, recommendedStorage: "7–10°C" },
  pumpkin: { name: "Pumpkin", coldStorageCrop: true, recommendedStorage: "10°C" },
  asparagus: { name: "Asparagus", coldStorageCrop: true, recommendedStorage: "0°C" },
  beetroot: { name: "Beetroot", coldStorageCrop: true, recommendedStorage: "0°C" },
  chilli: { name: "Chilli", coldStorageCrop: true, recommendedStorage: "7–10°C" },
  greenBeans: { name: "Green Beans", coldStorageCrop: true, recommendedStorage: "7–10°C" },
  greenPepper: { name: "Green Pepper", coldStorageCrop: true, recommendedStorage: "7–10°C" },
  redCabbage: { name: "Red Cabbage", coldStorageCrop: true, recommendedStorage: "0°C" },
  redOnion: { name: "Red Onion", coldStorageCrop: true, recommendedStorage: "4–5°C" },
  redPepper: { name: "Red Pepper", coldStorageCrop: true, recommendedStorage: "7–10°C" },
  yellowPepper: { name: "Yellow Pepper", coldStorageCrop: true, recommendedStorage: "7–10°C" },
};

export function getVegetableConfig(name: string) {
  return Object.values(coldStorageVegetables).find(
    (vegetable) => vegetable.name.toLowerCase() === name.toLowerCase(),
  );
}
