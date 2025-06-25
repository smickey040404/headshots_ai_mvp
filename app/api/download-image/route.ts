import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get the image URL from the query parameters
  const url = request.nextUrl.searchParams.get("url");
  
  // Check if URL is provided
  if (!url) {
    return NextResponse.json(
      { error: "Missing image URL" },
      { status: 400 }
    );
  }
  
  try {
    // Fetch the image from the original source
    const imageResponse = await fetch(url);
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.statusText}` },
        { status: imageResponse.status }
      );
    }
    
    // Get the image as a blob
    const imageBlob = await imageResponse.blob();
    
    // Get the content type of the image
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    
    // Create a response with the image data
    const response = new NextResponse(imageBlob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="headshot-${Date.now()}.${contentType.split('/')[1]}"`,
        "Cache-Control": "no-cache",
      },
    });
    
    return response;
  } catch (error) {
    console.error("Error downloading image:", error);
    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 500 }
    );
  }
} 