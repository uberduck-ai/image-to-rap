"use server";
import OpenAI from "openai";

const openai = new OpenAI();

const uberduckAPI = "https://api.uberduck.ai";
const uberduckBackingTrackUUID = "eb3217e5-1097-4342-a67c-adf505ce0723";
const uberduckVoiceUUID = "1598e3a2-70af-4bb8-adce-de6cfb24064e";
const uberduckAPIKey = process.env.UBERDUCK_API_KEY;
const uberduckAPISecret = process.env.UBERDUCK_API_SECRET;
const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cfImagesAPIToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN;

export async function generateRap(
  currentState: { message: string; lyrics: string[][]; songUrl: string },
  formData: FormData
) {
  const image = formData.get("image");
  const tone = formData.get("tone");

  // Upload the image to Cloudflare images.
  const cffd = new FormData();
  cffd.append("file", image as Blob);
  const imageResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/images/v1`,
    {
      method: "POST",
      headers: new Headers({
        Authorization: `Bearer ${cfImagesAPIToken}`,
      }),
      body: cffd,
    }
  );
  const imageUrl = (await imageResponse.json()).result.variants[0];

  // Get the description of the image from the OpenAI API.
  const visionCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `What's in this image? Describe it in a ${tone} tone.`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "low",
            },
          },
        ],
      },
    ],
    model: "gpt-4-vision-preview",
    max_tokens: 300,
  });
  const imageDescription = visionCompletion.choices[0].message.content;

  // Use the description of the image as input to the Uberduck rap generation API.
  const udHeaders = new Headers({
    Authorization: `Basic ${Buffer.from(
      `${uberduckAPIKey}:${uberduckAPISecret}`
    ).toString("base64")}`,
    "Content-Type": "application/json",
  });
  const lyricsResponse = await fetch(`${uberduckAPI}/tts/lyrics`, {
    method: "POST",
    headers: udHeaders,
    body: JSON.stringify({
      backing_track: uberduckBackingTrackUUID,
      subject: `Write a rap about the an image. Make the tone of the rap ${tone}. Here's what the image shows: ${imageDescription}`,
    }),
  });
  const lyrics = (await lyricsResponse.json()).lyrics;

  const rapResponse = await fetch(`${uberduckAPI}/tts/freestyle`, {
    method: "POST",
    headers: udHeaders,
    body: JSON.stringify({
      backing_track: uberduckBackingTrackUUID,
      voicemodel_uuid: uberduckVoiceUUID,
      lyrics: lyrics,
    }),
  });
  const rapData = await rapResponse.json();

  return {
    message: imageDescription as string,
    lyrics: lyrics as string[][],
    songUrl: rapData.mix_url as string,
  };
}
