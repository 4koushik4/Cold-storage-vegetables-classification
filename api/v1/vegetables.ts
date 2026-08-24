const vegetables = [
  "Tomato", "Carrot", "Broccoli", "Potato", "Cucumber", "Cauliflower", "Cabbage", "Pumpkin",
  "Bean", "Bitter_Gourd", "Bottle_Gourd", "Brinjal", "Capsicum", "Radish",
];

export default function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  response.status(200).json({ vegetables, confidenceThreshold: 0.7 });
}
