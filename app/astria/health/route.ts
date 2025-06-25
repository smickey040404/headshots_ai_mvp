import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Check environment variables
  const config = {
    astriaApiConfigured: !!process.env.ASTRIA_API_KEY,
    webhookSecretConfigured: !!process.env.APP_WEBHOOK_SECRET,
    deploymentUrlConfigured: !!process.env.DEPLOYMENT_URL,
    tuneType: process.env.NEXT_PUBLIC_TUNE_TYPE || "not set",
    packQueryType: process.env.PACK_QUERY_TYPE || "not set",
    stripeEnabled: process.env.NEXT_PUBLIC_STRIPE_IS_ENABLED === "true",
    blobStorageConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
    emailNotificationsConfigured: !!process.env.RESEND_API_KEY,
  };

  // Calculate overall health
  const missingCriticalConfig = !config.astriaApiConfigured || !config.webhookSecretConfigured;
  
  return NextResponse.json({
    status: missingCriticalConfig ? "error" : "ok",
    message: missingCriticalConfig 
      ? "Missing critical configuration. Check your environment variables." 
      : "API is properly configured",
    config
  }, { 
    status: missingCriticalConfig ? 500 : 200 
  });
} 