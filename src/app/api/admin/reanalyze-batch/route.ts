import { NextResponse } from "next/server";
import { reanalyzeBatchAction } from "@/actions/batch.actions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batch_id") || "btcal_8201kzp9snx2ejb9myz3rqs3dq2k";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  const skipProcessed = searchParams.get("skip_processed") === "true";

  try {
    const result = await reanalyzeBatchAction(batchId, limit, skipProcessed);
    return NextResponse.json({
      message: `Batch re-analysis triggered for ${batchId}`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to re-analyze batch" },
      { status: 500 }
    );
  }
}
