export default function handler(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  response.status(200).json({
    status: "ok",
    model: process.env.ROBOFLOW_MODEL_ID ?? "vegetable-classification-t6t4d/1",
    cameraProvider: "qwen/qwen3.6-27b",
    roboflowConfigured: Boolean(process.env.ROBOFLOW_API_KEY),
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
  });
}
