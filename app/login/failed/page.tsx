import { LoginFail } from "./components/LoginFail";

export default async function Page({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {

    let errorMessage = "Something went wrong, please reach out to support.";

    if (searchParams?.err !== undefined) {
        const errorCode = searchParams["err"];
        switch (errorCode) {
            case "AuthApiError":
                errorMessage = "The verification link is invalid or has expired. Please try logging in again.";
                break;
            case "EmailConfirmationError":
                errorMessage = "There was an error confirming your email. Please try again or contact support.";
                break;
            case "PasswordError":
                errorMessage = "Invalid login credentials. Please check your email and password.";
                break;
            case "500":
                errorMessage = "Something went wrong, please reach out to support.";
                break;
        }
    }

    return (
        <div className="flex flex-col flex-1 w-full h-[calc(100vh-73px)]">
            <LoginFail errorMessage={errorMessage} />
        </div>
    );
}
