import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { initiateOutboundCall } from "../../../inngest/functions";

// Create an API that serves zero-dependency npx inngest-cli
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    initiateOutboundCall,
  ],
});
