import { spawn } from "bun";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

export async function compileTypstToPDF(
  source: Uint8Array | string,
): Promise<Buffer> {
  const tmp = tmpdir();
  const id = crypto.randomUUID();
  const typPath = join(tmp, `${id}.typ`);
  const pdfPath = join(tmp, `${id}.pdf`);

  // Write the .typ source
  await writeFile(typPath, source);

  // Compile using typst CLI
  const proc = spawn({
    cmd: ["typst", "compile", typPath, pdfPath],
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await proc.exited;
  if (!proc.exited || proc.exitCode !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`Typst compilation failed: ${err}`);
  }

  // Read compiled PDF
  const pdf = await readFile(pdfPath);

  // Cleanup
  await unlink(typPath);
  await unlink(pdfPath);

  return pdf;
}
