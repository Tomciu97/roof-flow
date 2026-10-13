import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/report-document";
import type { CalculationBreakdown, WizardState } from "./types";

export async function generateReportPdf(opts: {
  state: WizardState;
  result: CalculationBreakdown;
  companyName?: string;
}): Promise<Buffer> {
  const buffer = await renderToBuffer(
    ReportDocument({
      state: opts.state,
      result: opts.result,
      companyName: opts.companyName,
    })
  );
  return Buffer.from(buffer);
}
