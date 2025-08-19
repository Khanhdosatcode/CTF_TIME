import { serveDir } from "jsr:@std/http/file-server";

Deno.serve( {port: 1337}, async (req) => {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/upload") {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return new Response("no file provided", { status: 400 });
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      const hex = Array.from(randomBytes).map((b) =>
        b.toString(16).padStart(2, "0")
      ).join("");
      const filename = `${hex}.mid`;
      await Deno.writeFile(`uploads/${filename}`, bytes);
      
      return new Response(JSON.stringify({
        filename: filename,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(`upload failed`, { status: 500 });
    }
  }

  if (url.pathname === "/") {
    const file = await Deno.readFile("./index.html");
    return new Response(file, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (url.pathname.startsWith("/uploads/")) {
    return serveDir(req, {
      fsRoot: "uploads",
      urlRoot: "uploads",
    });
  }

  return serveDir(req, {
    fsRoot: "static",
    urlRoot: "static",
    showDirListing: true,
    showDotfiles: true,
  });
});
