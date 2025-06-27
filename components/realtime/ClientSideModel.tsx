"use client";

import { Icons } from "@/components/icons";
import { Database } from "@/types/supabase";
import { imageRow, modelRow, sampleRow } from "@/types/utils";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { AspectRatio } from "../ui/aspect-ratio";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Download, Eye, X } from "lucide-react";

export const revalidate = 0;

type ClientSideModelProps = {
  serverModel: modelRow;
  serverImages: imageRow[];
  samples: sampleRow[];
};

export default function ClientSideModel({
  serverModel,
  serverImages,
  samples,
}: ClientSideModelProps) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
  const [model, setModel] = useState<modelRow>(serverModel);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-model")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "models" },
        (payload: { new: modelRow }) => {
          setModel(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, model, setModel]);
  const downloadImage = (imageUrl: string, filename: string) => {
    try {
      // Instead of directly fetching the image, use our proxy API
      const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}`;
      
      // Create an anchor element to trigger the download
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename || 'headshot.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div id="train-model-container" className="w-full h-full">
      <div className="flex flex-col w-full mt-4 gap-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-0">
          {samples && (
            <div className="flex w-full lg:w-1/2 flex-col gap-2">
              <h2 className="text-xl">Training Data</h2>
              <div className="flex flex-row gap-4 flex-wrap">
                {samples.map((sample, index) => (
                  <img
                    key={index}
                    src={sample.uri}
                    className="rounded-md w-60 h-60 object-cover"
                  />
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col w-full lg:w-1/2 rounded-md">
            {model.status === "finished" && (
              <div className="flex flex-1 flex-col gap-2">
                <h1 className="text-xl">Results</h1>
                <div className="flex flex-row flex-wrap gap-4">
                  {serverImages?.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.uri}
                        className="rounded-md w-60 h-60 object-cover"
                        alt={`Generated image ${image.id}`}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                        <Button 
                          size="icon" 
                          variant="secondary"
                          onClick={() => setPreviewImage(image.uri)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="secondary"
                          onClick={() => downloadImage(image.uri, `headshot-${image.id}.jpg`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => {
        if (!open) setPreviewImage(null);
      }}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>
              <Button 
                className="absolute right-4 top-4" 
                variant="ghost" 
                size="icon"
                onClick={() => setPreviewImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center">
            {previewImage && (
              <img 
                src={previewImage} 
                alt="Preview" 
                className="max-h-[70vh] max-w-full object-contain"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => previewImage && downloadImage(previewImage, `headshot-preview.jpg`)}
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
