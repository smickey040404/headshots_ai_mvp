"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import disposableDomains from "disposable-email-domains";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { AiOutlineGoogle } from "react-icons/ai";

type Inputs = {
  email: string;
  password: string;
  confirmPassword?: string;
};

export const Login = ({
  host,
  searchParams,
}: {
  host: string | null;
  searchParams?: { [key: string]: string | string[] | undefined };
}) => {
  const supabase = createClientComponentClient<Database>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
    reset
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setIsSubmitting(true);
    try {
      if (isResetPassword) {
        // Password reset
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${protocol}://${host}/auth/callback?next=/reset-password`,
        });
        
        if (error) throw error;
        
        setConfirmEmailSent(true);
        toast({
          title: "Password reset email sent",
          description: "Check your inbox for a link to reset your password.",
          duration: 5000,
        });
      } else if (isSignUp) {
        // Sign up with email and password
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${protocol}://${host}/auth/callback`,
          },
        });

        if (error) throw error;
        
        setConfirmEmailSent(true);
        toast({
          title: "Verification email sent",
          description: "Please check your inbox to confirm your email address.",
          duration: 5000,
        });
      } else {
        // Sign in with email and password
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        variant: "destructive",
        description: error?.message || "Please try again or contact support",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  let inviteToken = null;
  if (searchParams && "inviteToken" in searchParams) {
    inviteToken = searchParams["inviteToken"];
  }

  const protocol = host?.includes("localhost") ? "http" : "https";
  const redirectUrl = `${protocol}://${host}/auth/callback`;

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    console.log(data, error);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsResetPassword(false);
    reset();
  };

  const toggleResetPassword = () => {
    setIsResetPassword(!isResetPassword);
    setIsSignUp(false);
    reset();
  };

  if (confirmEmailSent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col gap-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 p-4 rounded-xl max-w-sm w-full">
          <h1 className="text-xl">{isResetPassword ? "Check your email" : "Verify your email"}</h1>
          <p className="text-sm">
            {isResetPassword 
              ? "We've sent you a password reset email. Please check your inbox and click the link to reset your password."
              : "We've sent you a verification email. Please check your inbox and click the link to confirm your email address."
            }
          </p>
          <p className="text-xs opacity-60">
            If you don't receive the email within a few minutes, check your spam folder.
          </p>
          <Button onClick={() => {
            setConfirmEmailSent(false);
            setIsResetPassword(false);
          }} variant="outline">
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col gap-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 p-4 rounded-xl max-w-sm w-full">
          <h1 className="text-xl">
            {isResetPassword 
              ? "Reset Password"
              : isSignUp 
                ? "Create Account" 
                : "Welcome Back"}
          </h1>
          <p className="text-xs opacity-60">
            {isResetPassword
              ? "Enter your email to receive a password reset link"
              : isSignUp 
                ? "Sign up to create your account" 
                : "Sign in to your account"}
          </p>
          
          {!isResetPassword && (
            <>
              <Button
                onClick={signInWithGoogle}
                variant={"outline"}
                className="font-semibold"
              >
                <AiOutlineGoogle size={20} className="mr-2" />
                Continue with Google
              </Button>
              <OR />
            </>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Input
                  type="email"
                  placeholder="Email"
                  {...register("email", {
                    required: "Email is required",
                    validate: {
                      emailIsValid: (value: string) =>
                        /^[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ||
                        "Please enter a valid email",
                      emailIsntDisposable: (value: string) =>
                        !disposableDomains.includes(value.split("@")[1]) ||
                        "Please use a permanent email address",
                    },
                  })}
                />
                {isSubmitted && errors.email && (
                  <span className={"text-xs text-red-400"}>
                    {errors.email?.message}
                  </span>
                )}
              </div>
              
              {!isResetPassword && (
                <div className="flex flex-col gap-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                  />
                  {isSubmitted && errors.password && (
                    <span className={"text-xs text-red-400"}>
                      {errors.password?.message}
                    </span>
                  )}
                </div>
              )}
              
              {isSignUp && !isResetPassword && (
                <div className="flex flex-col gap-2">
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) => 
                        value === watch("password") || "Passwords do not match",
                    })}
                  />
                  {isSubmitted && errors.confirmPassword && (
                    <span className={"text-xs text-red-400"}>
                      {errors.confirmPassword?.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            <Button
              isLoading={isSubmitting}
              disabled={isSubmitting}
              variant="default"
              className="w-full mt-2"
              type="submit"
            >
              {isResetPassword 
                ? "Send Reset Link"
                : isSignUp 
                  ? "Create Account" 
                  : "Sign In"}
            </Button>
          </form>
          
          <div className="text-center mt-2 space-y-2">
            {!isResetPassword && (
              <button 
                type="button"
                onClick={toggleMode} 
                className="text-sm text-primary hover:underline"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"}
              </button>
            )}
            
            <div>
              <button 
                type="button"
                onClick={toggleResetPassword} 
                className="text-sm text-primary hover:underline"
              >
                {isResetPassword
                  ? "Back to login"
                  : "Forgot your password?"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const OR = () => {
  return (
    <div className="flex items-center my-1">
      <div className="border-b flex-grow mr-2 opacity-50" />
      <span className="text-sm opacity-50">OR</span>
      <div className="border-b flex-grow ml-2 opacity-50" />
    </div>
  );
};
