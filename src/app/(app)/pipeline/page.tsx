import { PIPELINE_STAGES } from "@/lib/data";
import { PipelineBoard } from "@/components/PipelineBoard";

export default function PipelinePage() {
  return <PipelineBoard stages={PIPELINE_STAGES} />;
}
