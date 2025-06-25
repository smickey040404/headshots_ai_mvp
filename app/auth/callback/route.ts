import { Database } from "@/types/supabase";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { isAuthApiError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const next = requestUrl.searchParams.get("next") || "/";
  const error_description = requestUrl.searchParams.get("error_description");
  const type = requestUrl.searchParams.get("type") || "recovery";

  if (error) {
    console.log("error: ", {
      error,
      error_description,
      code,
    });
  }

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    try {
      // Exchange the received code for a session
      await supabase.auth.exchangeCodeForSession(code);

      // If this is an email confirmation after signup, create initial credits for the user
      if (type === "signup") {
        const { data: user, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error(
            "[auth] [confirmation] [500] Error getting user: ",
            userError
          );
          return NextResponse.redirect(
            `${requestUrl.origin}/login/failed?err=500`
          );
        }

        // Check if the user already has a credits record
        const { data: existingCredits, error: creditCheckError } = await supabase
          .from("credits")
          .select("*")
          .eq("user_id", user.user.id)
          .single();

        // If no credits record exists, create one
        if (!existingCredits && !creditCheckError) {
          const { error: errorCreatingCredits } = await supabase
            .from("credits")
            .insert({
              user_id: user.user.id,
              credits: 0,
            });

          if (errorCreatingCredits) {
            console.error("[auth] [confirmation] Credits creation error:", errorCreatingCredits);
          }
        }
      }

      return NextResponse.redirect(new URL(next, req.url));
    } catch (error) {
      if (isAuthApiError(error)) {
        console.error(
          "[auth] [confirmation] [500] Error exchanging code for session: ",
          error
        );
        return NextResponse.redirect(
          `${requestUrl.origin}/login/failed?err=AuthApiError`
        );
      } else {
        console.error("[auth] [confirmation] [500] Something wrong: ", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/login/failed?err=500`
        );
      }
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
