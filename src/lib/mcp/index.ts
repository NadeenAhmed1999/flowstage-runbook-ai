import { auth, defineMcp } from "@lovable.dev/mcp-js";
import generateRunSheetTool from "./tools/generate-run-sheet";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "flowstage-mcp",
  title: "FlowStage",
  version: "0.1.0",
  instructions:
    "FlowStage tools for AI-generated event operations. Use `generate_run_sheet` to produce a professional, minute-by-minute run-of-show document for a conference, summit, or panel event. Provide event name, type, date, sessions (with speakers and moderators), breaks, sponsors, and any AV requirements.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [generateRunSheetTool],
});
