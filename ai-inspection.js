
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from
  "https://www.gstatic.com/firebasejs/12.5.0/firebase-app-check.js";

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend
} from
  "https://www.gstatic.com/firebasejs/12.5.0/firebase-ai.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    "6LemjDIuAAAAAMArgzM62UA8UJejtD1wBvZLjGyV"
  ),
  isTokenAutoRefreshEnabled: true
});

const ai = getAI(app, {
  backend: new GoogleAIBackend()
});

const model = getGenerativeModel(ai, {
  model: "gemini-3.8-flash"
});

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        inlineData: {
          data: reader.result.split(",")[1],
          mimeType: file.type
        }
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeEquipment(
  file,
  tractorModel,
  inspectionArea,
  observations
) {
  if (!file) {
    throw new Error("Please upload a photo.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Maximum photo size is 10 MB.");
  }

  const image = await readPhoto(file);

  const prompt = `
    You are an agricultural equipment
    visual inspection assistant.

    Equipment: ${tractorModel}
    Inspection area: ${inspectionArea}
    User observations: ${observations}

    Generate a professional report in English.

    Include:
    1. Image quality assessment.
    2. Visible equipment condition.
    3. Visible signs of wear or damage.
    4. Potential concerns requiring expert review.
    5. Limitations of the visual assessment.
    6. Suggested professional inspection priorities.

    Do not invent defects.
    Clearly distinguish observations from assumptions.
    Do not provide machinery repair or operation
    instructions.
    Never certify equipment as safe to operate.
    Recommend assessment by a qualified technician.

    End with:
    AI-assisted visual screening only.
    Not a certified technical inspection.
  `;

  const response = await model.generateContent([
    prompt,
    image
  ]);

  return response.response.text();
}
