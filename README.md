🖨️ Typst PDF Generator API

A blazing-fast PDF generation API built with Bun, Hono, and Typst. Compile .typ files or raw Typst source to PDF, and either stream, download, or upload to cloud (S3/R2/Spaces/MinIO) — including custom S3-compatible storage!

✅ Features
• 🧾 Convert .typ files or raw Typst source to PDF
• 🚀 Built-in Typst CLI execution via Docker
• 📤 Upload PDFs directly to:
• AWS S3
• Cloudflare R2
• DigitalOcean Spaces
• MinIO
• Any custom S3-compatible backend
• 🌐 CDN support for instant file access
• 🧪 Multipart file upload or JSON-based string input
• 🪶 Lightweight & Bun-native using Bun.S3Client
• 🧱 Simple endpoints, perfect for backend pipelines or frontend tooling

⸻

⚙️ Endpoints

POST /v1/pdf

Input: .typ file via multipart/form-data

Option (Header) Description
x-upload true to upload the PDF to default S3
x-filename Custom filename (default: random UUID)
x-stream true to stream PDF instead of downloading

    •	📤 If x-upload: true, PDF is uploaded to default S3 config
    •	📥 If x-stream: true, PDF is streamed as raw application/pdf
    •	🔽 Else, PDF is downloaded as an attachment

POST /v1/pdf/string

Input: JSON with raw Typst source

{
"source": "Hello, _Typst_!",
"options": {
"upload": true,
"stream": false,
"filename": "hello.pdf"
}
}

Same headers (x-upload, x-filename, x-stream) apply as optional overrides.

POST /v1/pdf/mys3

Input: .typ file via multipart/form-data

Headers:

Header Name Description
x-s3-access-key Required: Access key for your S3 provider
x-s3-secret-key Required: Secret key
x-s3-endpoint Required: S3 endpoint (e.g., https://...)
x-s3-bucket Required: Bucket name
x-s3-cdn-url Required: Base public CDN URL (for response)
x-s3-filename Optional: Filename to upload (default: UUID)

🎯 Returns the full public URL based on cdn-url + filename.

⸻

🧪 Examples

Curl - Compile .typ and stream result

curl -X POST http://localhost:3000/v1/pdf \
 -H "x-stream: true" \
 -F "file=@document.typ" \
 --output output.pdf

Curl - Upload compiled PDF to default S3

curl -X POST http://localhost:3000/v1/pdf \
 -H "x-upload: true" \
 -H "x-filename: invoice.pdf" \
 -F "file=@invoice.typ"

Curl - Custom S3 Upload

curl -X POST http://localhost:3000/v1/pdf/mys3 \
 -H "x-s3-access-key: ACCESSKEY" \
 -H "x-s3-secret-key: SECRETKEY" \
 -H "x-s3-endpoint: https://nyc3.digitaloceanspaces.com" \
 -H "x-s3-bucket: my-bucket" \
 -H "x-s3-cdn-url: https://cdn.mybucket.com" \
 -H "x-s3-filename: report.pdf" \
 -F "file=@report.typ"

⸻

🚀 Setup & Run

1. Clone

git clone https://github.com/thanksduck/typst2pdf.git
cd typst2pdf

2. Install deps

bun install

3. Add Typst Docker container (required)

docker pull ghcr.io/typst/typst:latest

Make sure Docker is running — Typst CLI is executed in a container.

4. Add environment variables (optional for default S3)

Create a .env:

S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=my-default-bucket
S3_CDN_URL=https://cdn.mybucket.com

5. Run

bun run src/index.ts

⸻

🧰 Tech Stack
• Bun
• Hono (Express-style web framework)
• Typst (LaTeX alternative)
• Docker
• Bun.S3Client for seamless S3 integration

⸻

📦 Future Ideas
• Typst project zip support
• Token-based auth
• Caching with Bun KV or Redis
• Custom font and asset support
• Web dashboard to view past jobs

⸻

🧑‍💻 Author

Śivam Śukla
🔗 @sivm99
💻 B.Tech CSE | Full-stack Dev | Backend, Go, MERN, Bun Enthusiast

⸻

🪪 License

MIT © Śivam Śukla

⸻

Want me to generate a LICENSE, .env.example, or bunfig.toml too?
