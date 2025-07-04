"use client";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";
import { modelRowWithSamples } from "@/types/utils";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaImages } from "react-icons/fa";
import ModelsTable from "../ModelsTable";
import { decode } from "punycode";

const packsIsEnabled = process.env.NEXT_PUBLIC_TUNE_TYPE === "packs";

export const revalidate = 0;

type ClientSideModelsListProps = {
  serverModels: modelRowWithSamples[] | [];
  userId: string;
};

export default function ClientSideModelsList({
  serverModels,
  userId,
}: ClientSideModelsListProps) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const [user, setUser] = useState<string>(userId || "");
  const [models, setModels] = useState<modelRowWithSamples[]>(serverModels);
  useEffect(()=>{
    supabase.from("models").select("*").eq("user_id", user).then(({data})=>{
      if (data) {
        data.forEach((model)=>{
        supabase
            .from("samples")
            .select("*")
            .eq("modelId", model.id)
            .then((samplesResult) => {
              const newModel: modelRowWithSamples = {
                ...model,
                samples: samplesResult.data || [],
              };

              const dedupedModels = models.filter(
                (model) => model.id !== model.id
              );

              setModels([newModel]);
            });
        });
      }
    });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-models")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "models", filter: `user_id=eq.${user}` },
        (payload: any) => {
          console.log("payload", payload.new.id);
          supabase
            .from("samples")
            .select("*")
            .eq("modelId", payload.new.id)
            .then((samplesResult) => {
              const newModel: modelRowWithSamples = {
                ...payload.new,
                samples: samplesResult.data,
              };

              const dedupedModels = models.filter(
                (model) => model.id !== payload.old?.id
              );

              setModels([...dedupedModels, newModel]);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, models, setModels]);

  return (
    <div id="train-model-container" className="w-full">
      {models && models.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 w-full justify-between items-center text-center">
            <h1>Your models</h1>
            <Link href={packsIsEnabled ? "/overview/packs" : "/overview/models/train/raw-tune"} className="w-fit">
              <Button size={"sm"}>
                Train model
              </Button>
            </Link>
          </div>
          <ModelsTable models={models} />
        </div>
      )}
      {models && models.length === 0 && (
        <div className="flex flex-col gap-4 items-center">
          <FaImages size={64} className="text-gray-500" />
          <h1 className="text-2xl">
            Get started by training your first model.
          </h1>
          <div>
            <Link href={packsIsEnabled ? "/overview/packs" : "/overview/models/train/raw-tune"}>
              <Button size={"lg"}>Train model</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
