import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  Settings,
  FileDown,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PDFGenerator() {
  // Common states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // File to PDF states
  const [file, setFile] = useState(null);
  const [uploadToS3, setUploadToS3] = useState(false);
  const [streamResponse, setStreamResponse] = useState(true);
  const [filename, setFilename] = useState("");

  // Text to PDF states
  const [typstSource, setTypstSource] = useState("");

  // Custom S3 states
  const [s3File, setS3File] = useState(null);
  const [s3AccessKey, setS3AccessKey] = useState("");
  const [s3SecretKey, setS3SecretKey] = useState("");
  const [s3Endpoint, setS3Endpoint] = useState("");
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3CdnUrl, setS3CdnUrl] = useState("");
  const [s3Filename, setS3Filename] = useState("");

  // Refs for file inputs
  const fileInputRef = useRef(null);
  const s3FileInputRef = useRef(null);

  // File drop zone states
  const [fileDropActive, setFileDropActive] = useState(false);
  const [s3FileDropActive, setS3FileDropActive] = useState(false);

  // Example Typst code
  const exampleTypstCode = `#set page(
  paper: "a4",
  margin: (x: 2.5cm, y: 3cm),
)

#set text(
  font: "New Computer Modern",
  size: 11pt,
)

= PDF Generator Demo

This is an example document created with Typst.

== Features

- *Automatic* layout and formatting
- _Beautiful_ mathematical typesetting
- #emph[Easy] to use syntax

#figure(
  rect(width: 100%, height: 35pt, fill: gradient.linear(blue.lighten(30%), blue.lighten(80%), blue.lighten(30%), angle: 45deg)),
  caption: [A sample figure with gradient],
)

$ x^2 + y^2 = z^2 $
`;

  // Handler for file upload
  const handleFileChange = (e, setFileFunction) => {
    if (e.target.files.length > 0) {
      setFileFunction(e.target.files[0]);
    }
  };

  // Handler for drag and drop
  const handleDragOver = (e, setDropActiveFunction) => {
    e.preventDefault();
    setDropActiveFunction(true);
  };

  const handleDragLeave = (e, setDropActiveFunction) => {
    e.preventDefault();
    setDropActiveFunction(false);
  };

  const handleDrop = (e, setFileFunction, setDropActiveFunction) => {
    e.preventDefault();
    setDropActiveFunction(false);
    if (e.dataTransfer.files.length > 0) {
      setFileFunction(e.dataTransfer.files[0]);
    }
  };

  // Reset all states
  const resetStates = () => {
    setResult(null);
    setError(null);
  };

  // Copy URL to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("URL copied to clipboard!");
    });
  };

  // Open URL in new tab
  const openInNewTab = (url) => {
    window.open(url, "_blank");
  };

  // Submit handlers for each tab
  const handleFileToPDF = async () => {
    resetStates();
    if (!file) {
      setError("Please select a file to convert");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const headers = {};
      if (filename) headers["x-filename"] = filename;
      if (uploadToS3) headers["x-upload"] = "true";
      if (!streamResponse) headers["x-stream"] = "false";

      const response = await fetch("/api/file2pdf", {
        method: "POST",
        headers,
        body: formData,
      });

      if (uploadToS3) {
        const data = await response.json();
        if (data.success) {
          setResult(data);
        } else {
          setError(data.message || "Failed to convert file to PDF");
        }
      } else {
        // For direct PDF response or streaming
        if (response.ok) {
          // Open the PDF in a new tab
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
          setResult({ localUrl: url });
        } else {
          const data = await response.json();
          setError(data.message || "Failed to convert file to PDF");
        }
      }
    } catch (err) {
      setError("An error occurred during the conversion process");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextToPDF = async () => {
    resetStates();
    if (!typstSource) {
      setError("Please enter Typst source code");
      return;
    }

    try {
      setLoading(true);

      const headers = {
        "Content-Type": "application/json",
      };

      if (filename) headers["x-filename"] = filename;
      if (uploadToS3) headers["x-upload"] = "true";
      if (!streamResponse) headers["x-stream"] = "false";

      const response = await fetch("/api/v1/pdf/text", {
        method: "POST",
        headers,
        body: JSON.stringify({ source: typstSource }),
      });

      if (uploadToS3) {
        const data = await response.json();
        if (data.success) {
          setResult(data);
        } else {
          setError(data.message || "Failed to convert text to PDF");
        }
      } else {
        // For direct PDF response or streaming
        if (response.ok) {
          // Open the PDF in a new tab
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
          setResult({ localUrl: url });
        } else {
          const data = await response.json();
          setError(data.message || "Failed to convert text to PDF");
        }
      }
    } catch (err) {
      setError("An error occurred during the conversion process");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomS3Upload = async () => {
    resetStates();
    if (!s3File) {
      setError("Please select a file to upload");
      return;
    }

    if (!s3AccessKey || !s3SecretKey || !s3Endpoint || !s3Bucket || !s3CdnUrl) {
      setError("Please fill in all required S3 fields");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", s3File);

      const headers = {
        "x-s3-access-key": s3AccessKey,
        "x-s3-secret-key": s3SecretKey,
        "x-s3-endpoint": s3Endpoint,
        "x-s3-bucket": s3Bucket,
        "x-s3-cdn-url": s3CdnUrl,
      };

      if (s3Filename) headers["x-s3-filename"] = s3Filename;

      const response = await fetch("/api/mys3pdf", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || "Failed to upload to custom S3");
      }
    } catch (err) {
      setError("An error occurred during the S3 upload process");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Use example Typst code
  const useExampleCode = () => {
    setTypstSource(exampleTypstCode);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">PDF Generator</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Generate PDFs from Typst files and text with ease
          </p>
        </div>

        <Tabs defaultValue="file-to-pdf" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger
              value="file-to-pdf"
              className="flex items-center gap-2"
            >
              <FileText size={18} /> File to PDF
            </TabsTrigger>
            <TabsTrigger
              value="text-to-pdf"
              className="flex items-center gap-2"
            >
              <FileDown size={18} /> Text to PDF
            </TabsTrigger>
            <TabsTrigger value="custom-s3" className="flex items-center gap-2">
              <Upload size={18} /> Custom S3 Upload
            </TabsTrigger>
          </TabsList>

          {/* File to PDF Tab */}
          <TabsContent value="file-to-pdf">
            <Card>
              <CardHeader>
                <CardTitle>File to PDF</CardTitle>
                <CardDescription>
                  Upload a Typst file (.typ) and convert it to PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    fileDropActive
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary"
                  }`}
                  onClick={() => fileInputRef.current.click()}
                  onDragOver={(e) => handleDragOver(e, setFileDropActive)}
                  onDragLeave={(e) => handleDragLeave(e, setFileDropActive)}
                  onDrop={(e) => handleDrop(e, setFile, setFileDropActive)}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".typ"
                    onChange={(e) => handleFileChange(e, setFile)}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText size={48} className="text-gray-400" />
                    <div className="mt-2 font-medium">
                      {file ? (
                        <span className="text-primary">{file.name}</span>
                      ) : (
                        <span>
                          Drop your Typst file here or click to browse
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Supports .typ files</p>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="filename">Filename (optional)</Label>
                    <Input
                      id="filename"
                      placeholder="output.pdf"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      If not specified, a random UUID will be used
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="upload-switch">Upload to S3</Label>
                        <p className="text-xs text-gray-500">
                          Store the PDF in S3 instead of returning it directly
                        </p>
                      </div>
                      <Switch
                        id="upload-switch"
                        checked={uploadToS3}
                        onCheckedChange={(checked) => {
                          setUploadToS3(checked);
                          if (checked) {
                            setStreamResponse(false);
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="stream-switch">Stream Response</Label>
                        <p className="text-xs text-gray-500">
                          Stream the PDF for inline viewing (ignored if
                          uploading to S3)
                        </p>
                      </div>
                      <Switch
                        id="stream-switch"
                        checked={streamResponse}
                        disabled={uploadToS3}
                        onCheckedChange={setStreamResponse}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleFileToPDF}
                  disabled={loading || !file}
                  className="w-full md:w-auto"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <FileDown size={18} />
                      Generate PDF
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Text to PDF Tab */}
          <TabsContent value="text-to-pdf">
            <Card>
              <CardHeader>
                <CardTitle>Text to PDF</CardTitle>
                <CardDescription>
                  Enter Typst source code and convert it to PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="typst-source">Typst Source Code</Label>
                    <Button variant="ghost" size="sm" onClick={useExampleCode}>
                      Use Example
                    </Button>
                  </div>
                  <Textarea
                    id="typst-source"
                    placeholder="Enter your Typst code here..."
                    className="min-h-64 font-mono"
                    value={typstSource}
                    onChange={(e) => setTypstSource(e.target.value)}
                  />
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="text-filename">Filename (optional)</Label>
                    <Input
                      id="text-filename"
                      placeholder="output.pdf"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      If not specified, a random UUID will be used
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="text-upload-switch">Upload to S3</Label>
                        <p className="text-xs text-gray-500">
                          Store the PDF in S3 instead of returning it directly
                        </p>
                      </div>
                      <Switch
                        id="text-upload-switch"
                        checked={uploadToS3}
                        onCheckedChange={(checked) => {
                          setUploadToS3(checked);
                          if (checked) {
                            setStreamResponse(false);
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="text-stream-switch">
                          Stream Response
                        </Label>
                        <p className="text-xs text-gray-500">
                          Stream the PDF for inline viewing (ignored if
                          uploading to S3)
                        </p>
                      </div>
                      <Switch
                        id="text-stream-switch"
                        checked={streamResponse}
                        disabled={uploadToS3}
                        onCheckedChange={setStreamResponse}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleTextToPDF}
                  disabled={loading || !typstSource}
                  className="w-full md:w-auto"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <FileDown size={18} />
                      Generate PDF
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Custom S3 Upload Tab */}
          <TabsContent value="custom-s3">
            <Card>
              <CardHeader>
                <CardTitle>Custom S3 Upload</CardTitle>
                <CardDescription>
                  Convert a Typst file to PDF and upload it to your own S3
                  bucket
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    s3FileDropActive
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary"
                  }`}
                  onClick={() => s3FileInputRef.current.click()}
                  onDragOver={(e) => handleDragOver(e, setS3FileDropActive)}
                  onDragLeave={(e) => handleDragLeave(e, setS3FileDropActive)}
                  onDrop={(e) => handleDrop(e, setS3File, setS3FileDropActive)}
                >
                  <input
                    type="file"
                    ref={s3FileInputRef}
                    className="hidden"
                    accept=".typ"
                    onChange={(e) => handleFileChange(e, setS3File)}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText size={48} className="text-gray-400" />
                    <div className="mt-2 font-medium">
                      {s3File ? (
                        <span className="text-primary">{s3File.name}</span>
                      ) : (
                        <span>
                          Drop your Typst file here or click to browse
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Supports .typ files</p>
                  </div>
                </div>

                {/* S3 Configuration */}
                <Accordion type="single" collapsible defaultValue="s3-config">
                  <AccordionItem value="s3-config">
                    <AccordionTrigger className="text-lg font-medium">
                      <div className="flex items-center gap-2">
                        <Settings size={18} />
                        S3 Configuration
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="s3-access-key">Access Key ID</Label>
                          <Input
                            id="s3-access-key"
                            placeholder="AKIAIOSFODNN7EXAMPLE"
                            value={s3AccessKey}
                            onChange={(e) => setS3AccessKey(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="s3-secret-key">
                            Secret Access Key
                          </Label>
                          <Input
                            id="s3-secret-key"
                            type="password"
                            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                            value={s3SecretKey}
                            onChange={(e) => setS3SecretKey(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="s3-endpoint">Endpoint</Label>
                          <Input
                            id="s3-endpoint"
                            placeholder="s3.amazonaws.com"
                            value={s3Endpoint}
                            onChange={(e) => setS3Endpoint(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="s3-bucket">Bucket Name</Label>
                          <Input
                            id="s3-bucket"
                            placeholder="my-bucket"
                            value={s3Bucket}
                            onChange={(e) => setS3Bucket(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="s3-cdn-url">CDN URL</Label>
                          <Input
                            id="s3-cdn-url"
                            placeholder="https://cdn.example.com"
                            value={s3CdnUrl}
                            onChange={(e) => setS3CdnUrl(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="s3-filename">
                            Filename (optional)
                          </Label>
                          <Input
                            id="s3-filename"
                            placeholder="output.pdf"
                            value={s3Filename}
                            onChange={(e) => setS3Filename(e.target.value)}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleCustomS3Upload}
                  disabled={
                    loading ||
                    !s3File ||
                    !s3AccessKey ||
                    !s3SecretKey ||
                    !s3Endpoint ||
                    !s3Bucket ||
                    !s3CdnUrl
                  }
                  className="w-full md:w-auto"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload size={18} />
                      Upload to S3
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Result or Error Display */}
        {(result || error) && (
          <Card className={error ? "border-red-300" : "border-green-300"}>
            <CardHeader
              className={`${error ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20"}`}
            >
              <CardTitle className="flex items-center gap-2">
                {error ? (
                  <>
                    <AlertCircle className="text-red-500" size={20} />
                    <span>Error</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="text-green-500" size={20} />
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
                  {result.url && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">URL:</span>
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1 break-all">
                        {result.url}
                      </code>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(result.url)}
                          title="Copy URL"
                        >
                          <Copy size={18} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openInNewTab(result.url)}
                          title="Open in new tab"
                        >
                          <ExternalLink size={18} />
                        </Button>
                      </div>
                    </div>
                  )}
                  {result.localUrl && (
                    <p>The PDF has been generated and opened in a new tab.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
