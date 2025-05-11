import { useEffect, useState, useCallback } from "react"; // Added useCallback for completeness if handleUrlChange were outside
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { copyToClipboard, openInNewTab } from "@/lib/helper";

// IMPORTANT: Ensure history methods are wrapped as shown in "Fix B: Step 1"
// in a central part of your application (e.g., App.jsx or main.js)

export default function ResultAndError() {
  const [result, setResult] = useState<
    string | null | { url?: string | null; localUrl?: string | null }
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const resultParam = params.get("result");
      const errorParam = params.get("error");
      const urlParam = params.get("url");
      const localUrlParam = params.get("localUrl");

      // Clear previous states
      setError(null);
      setResult(null);

      if (errorParam) {
        setError(errorParam);
      } else if (urlParam || localUrlParam) {
        setResult({
          url: urlParam || null,
          localUrl: localUrlParam || null,
        });
      } else if (resultParam) {
        setResult(resultParam);
      }
    };

    handleUrlChange(); // Initial call

    // Listen to standard and custom history events
    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("pushstate", handleUrlChange); // For history.pushState
    window.addEventListener("replacestate", handleUrlChange); // For history.replaceState

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("pushstate", handleUrlChange);
      window.removeEventListener("replacestate", handleUrlChange);
    };
  }, []); // Empty dependency array is appropriate here as handleUrlChange is self-contained
  // and reads directly from window.location each time it's called.

  return (
    (result || error) && (
      <Card className={error ? "border-destructive" : "border-success"}>
        <CardHeader
          className={`${
            error
              ? "bg-destructive/10 dark:bg-destructive/20"
              : "bg-success/10 dark:bg-success/20"
          }`}
        >
          <CardTitle className="flex items-center gap-2">
            {error ? (
              <>
                <AlertCircle className="text-destructive" size={20} />
                <span>Error</span>
              </>
            ) : (
              <>
                <CheckCircle className="text-success" size={20} />
                <span>Success</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {result && typeof result === "string" && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Result:</span>
                  <code className="bg-muted dark:bg-muted/80 px-2 py-1 rounded flex-1 break-all">
                    {result}
                  </code>
                </div>
              )}
              {result && typeof result === "object" && result.url && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">URL:</span>
                  <code className="bg-muted dark:bg-muted/80 px-2 py-1 rounded flex-1 break-all">
                    {result.url}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(result?.url as string)}
                      title="Copy URL"
                    >
                      <Copy size={18} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openInNewTab(result?.url as string)}
                      title="Open in new tab"
                    >
                      <ExternalLink size={18} />
                    </Button>
                  </div>
                </div>
              )}
              {result && typeof result === "object" && result.localUrl && (
                <p>The PDF has been generated and opened in a new tab.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  );
}
