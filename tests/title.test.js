import { describe, expect, it } from "vitest";
import { generateTitle } from "@/lib/ai";

// Diagnostic: titles silently stay "New chat" with no error logged, which is
// what generateTitle returns when the model hands back empty content.

describe("generateTitle", () => {
  it("returns a real title rather than the fallback", async () => {
    const { title, usage } = await generateTitle(
      "How do I center a div in CSS?",
      "Use display: flex on the parent with justify-content: center and align-items: center."
    );

    console.log("title:", JSON.stringify(title));
    console.log("usage:", usage);

    expect(title).not.toBe("New chat");
  }, 30_000);
});
