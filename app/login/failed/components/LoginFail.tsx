import { ExternalLink } from "lucide-react";
import Link from "next/link";

export const LoginFail = ({
    errorMessage,
}: {
    errorMessage: string | null;
}) => {
    return (
        <div className="flex justify-center p-8">
            <div className="flex flex-col gap-4 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-md max-w-sm w-full mt-10">
                <h1 className="text-xl">Login Error</h1>
                <div className="flex flex-col gap-2">
                    <p className="text-sm">
                        {errorMessage}
                    </p>
                    <p className="text-xs opacity-60">
                        If you're having trouble logging in, please make sure you're using the correct credentials or request a password reset.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <Link href={"/login"}>
                        <div className="max-w-sm mx-auto flex gap-2 text-xs items-center justify-center hover:underline">
                            <p>Back to Login</p>
                            <ExternalLink size={16} />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};
