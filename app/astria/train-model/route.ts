import { Database } from "@/types/supabase";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Load and validate environment variables
const astriaApiKey = process.env.ASTRIA_API_KEY;
const astriaTestModeIsOn = process.env.ASTRIA_TEST_MODE === "true";
const packsIsEnabled = process.env.NEXT_PUBLIC_TUNE_TYPE === "packs";
const appWebhookSecret = process.env.APP_WEBHOOK_SECRET;
const stripeIsConfigured = process.env.NEXT_PUBLIC_STRIPE_IS_ENABLED === "true";
const deploymentUrl = process.env.DEPLOYMENT_URL || '';

// Log config for debugging
console.log("Train model API config:", {
  packsIsEnabled,
  astriaTestModeIsOn,
  stripeIsConfigured,
  hasAstriaApiKey: !!astriaApiKey,
  hasWebhookSecret: !!appWebhookSecret,
  deploymentUrl: deploymentUrl || "(not set - will use localhost)",
});

if (!appWebhookSecret) {
  console.error("MISSING APP_WEBHOOK_SECRET - Webhook calls from Astria won't work correctly!");
}

if (!astriaApiKey) {
  console.error("MISSING ASTRIA_API_KEY - The Astria API integration won't work!");
}

export async function POST(request: Request) {
  const payload = await request.json();
  const images = payload.urls;
  const type = payload.type;
  const pack = payload.pack;
  const name = payload.name;
  const characteristics = payload.characteristics || [];

  // Validate required fields
  if (!images || !Array.isArray(images)) {
    return NextResponse.json(
      {
        message: "Missing or invalid 'urls' field: Must provide an array of image URLs",
      },
      { status: 400 }
    );
  }

  if (!type) {
    return NextResponse.json(
      {
        message: "Missing 'type' field: Please specify a model type",
      },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json(
      {
        message: "Missing 'name' field: Please provide a name for the model",
      },
      { status: 400 }
    );
  }

  if (packsIsEnabled && !pack) {
    return NextResponse.json(
      {
        message: "Missing 'pack' field: A pack ID is required when using packs mode",
      },
      { status: 400 }
    );
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  if (images?.length < 4) {
    return NextResponse.json(
      {
        message: "Upload at least 4 sample images",
      },
      { status: 500 }
    );
  }
  let _credits = null;

  console.log({ stripeIsConfigured });
  if (stripeIsConfigured) {
    const { error: creditError, data: credits } = await supabase
      .from("credits")
      .select("credits")
      .eq("user_id", user.id);

    if (creditError) {
      console.error({ creditError });
      return NextResponse.json(
        {
          message: "Something went wrong!",
        },
        { status: 500 }
      );
    }

    if (credits.length === 0) {
      // create credits for user.
      const { error: errorCreatingCredits } = await supabase
        .from("credits")
        .insert({
          user_id: user.id,
          credits: 0,
        });

      if (errorCreatingCredits) {
        console.error({ errorCreatingCredits });
        return NextResponse.json(
          {
            message: "Something went wrong!",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          message:
            "Not enough credits, please purchase some credits and try again.",
        },
        { status: 500 }
      );
    } else if (credits[0]?.credits < 1) {
      return NextResponse.json(
        {
          message:
            "Not enough credits, please purchase some credits and try again.",
        },
        { status: 500 }
      );
    } else {
      _credits = credits;
    }
  }

  // create a model row in supabase
  const { error: modelError, data } = await supabase
    .from("models")
    .insert({
      user_id: user.id,
      name,
      type,
    })
    .select("id")
    .single();

  if (modelError) {
    console.error("modelError: ", modelError);
    return NextResponse.json(
      {
        message: "Something went wrong!",
      },
      { status: 500 }
    );
  }
  
  // Get the modelId from the created model
  const modelId = data?.id;

  try {
    let baseUrl;
    
    // Special handling for local development
    if (deploymentUrl.includes('localhost') || deploymentUrl === '') {
      baseUrl = 'http://localhost:3000';
    } else {
      baseUrl = deploymentUrl.startsWith('http://') || deploymentUrl.startsWith('https://') 
        ? deploymentUrl 
        : `https://${deploymentUrl}`;
    }

    const trainWebhook = `${baseUrl}/astria/train-webhook`;
    const trainWebhookWithParams = `${trainWebhook}?user_id=${user.id}&model_id=${modelId}&webhook_secret=${appWebhookSecret}`;

    const promptWebhook = `${baseUrl}/astria/prompt-webhook`;
    const promptWebhookWithParams = `${promptWebhook}?user_id=${user.id}&model_id=${modelId}&webhook_secret=${appWebhookSecret}`;

    console.log({ baseUrl, trainWebhookWithParams, promptWebhookWithParams });
    const API_KEY = astriaApiKey;
    const DOMAIN = "https://api.astria.ai";

    // Create a fine tuned model using Astria tune API
    const tuneBody = {
      tune: {
        title: name,
        // Hard coded tune id of Realistic Vision v5.1 from the gallery - https://www.astria.ai/gallery/tunes
        // https://www.astria.ai/gallery/tunes/690204/prompts
        base_tune_id: 690204,
        name: type,
        // branch: astriaTestModeIsOn ? "fast" : "sd15",
        branch: "sd15",
        token: "ohwx",
        image_urls: images,
        callback: trainWebhookWithParams,
        characteristics,
        prompts_attributes: [
          {
            text: `portrait of ohwx ${type} wearing a business suit, professional photo, white background, Amazing Details, Best Quality, Masterpiece, dramatic lighting highly detailed, analog photo, overglaze, 80mm Sigma f/1.4 or any ZEISS lens`,
            callback: promptWebhookWithParams,
            num_images: 8,
          },
          {
            text: `8k close up linkedin profile picture of ohwx ${type}, professional jack suite, professional headshots, photo-realistic, 4k, high-resolution image, workplace settings, upper body, modern outfit, professional suit, business, blurred background, glass building, office window`,
            callback: promptWebhookWithParams,
            num_images: 8,
          },
        ],
      },
    };

    // Create a fine tuned model using Astria packs API
    const packBody = {
      tune: {
        title: name,
        name: type,
        callback: trainWebhookWithParams,
        characteristics,
        prompt_attributes: {
          callback: promptWebhookWithParams,
        },
        image_urls: images,
      },
    };

    console.log('Sending request to Astria API:', {
      endpoint: DOMAIN + (packsIsEnabled ? `/p/${pack}/tunes` : "/tunes"),
      requestBody: packsIsEnabled ? packBody : tuneBody,
    });
    
    const response = await axios.post(
      DOMAIN + (packsIsEnabled ? `/p/${pack}/tunes` : "/tunes"),
      packsIsEnabled ? packBody : tuneBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    console.log('Astria API response:', {
      status: response.status,
      data: response.data,
    });

    const { status } = response;

    if (status !== 201) {
      console.error('Unexpected status code from Astria API:', { status });
      // Rollback: Delete the created model if something goes wrong
      if (modelId) {
        await supabase.from("models").delete().eq("id", modelId);
      }

      if (status === 400) {
        return NextResponse.json(
          {
            message: "webhookUrl must be a URL address",
          },
          { status }
        );
      }
      if (status === 402) {
        return NextResponse.json(
          {
            message: "Training models is only available on paid plans.",
          },
          { status }
        );
      }
      
      return NextResponse.json(
        {
          message: `Astria API returned status ${status}`,
        },
        { status: 500 }
      );
    }

    const { error: samplesError } = await supabase.from("samples").insert(
      images.map((sample: string) => ({
        modelId: modelId,
        uri: sample,
      }))
    );

    if (samplesError) {
      console.error("samplesError: ", samplesError);
      return NextResponse.json(
        {
          message: "Something went wrong!",
        },
        { status: 500 }
      );
    }

    if (stripeIsConfigured && _credits && _credits.length > 0) {
      const subtractedCredits = _credits[0].credits - 1;
      const { error: updateCreditError, data } = await supabase
        .from("credits")
        .update({ credits: subtractedCredits })
        .eq("user_id", user.id)
        .select("*");

      console.log({ data });
      console.log({ subtractedCredits });

      if (updateCreditError) {
        console.error({ updateCreditError });
        return NextResponse.json(
          {
            message: "Something went wrong!",
          },
          { status: 500 }
        );
      }
    }
  } catch (e) {
    console.error('Error while processing request:', e);
    
    // Rollback: Delete the created model if something goes wrong
    if (modelId) {
      try {
        await supabase.from("models").delete().eq("id", modelId);
        console.log(`Successfully deleted model ID ${modelId} after error`);
      } catch (deleteError) {
        console.error(`Failed to delete model ID ${modelId} after error:`, deleteError);
      }
    }
    
    // Provide more specific error messages based on error type
    if (axios.isAxiosError(e)) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
        return NextResponse.json(
          {
            message: "Could not connect to Astria API. Please check your internet connection and try again.",
          },
          { status: 503 }
        );
      }
      
      if (e.response) {
        // The request was made and the server responded with a status code outside of 2xx
        return NextResponse.json(
          {
            message: `Astria API error: ${e.response.data?.message || e.message || "Unknown error"}`,
            status: e.response.status,
          },
          { status: e.response.status || 500 }
        );
      } else if (e.request) {
        // The request was made but no response was received
        return NextResponse.json(
          {
            message: "No response received from Astria API. Please try again later.",
          },
          { status: 504 }
        );
      }
    }
    
    // Generic error fallback
    return NextResponse.json(
      {
        message: e instanceof Error ? e.message : "Something went wrong!",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: "success",
    },
    { status: 200 }
  );
}
