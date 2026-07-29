import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";

const OLLAMA_TIMEOUT_MS = 30_000;

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);
  private readonly url =
    process.env.OLLAMA_URL || "https://ollama.if.unismuh.ac.id/api/generate";
  private readonly model = process.env.OLLAMA_MODEL || "gemma4-16k:latest";

  /** Kirim prompt ke Ollama /api/generate, return teks jawaban. */
  async generate(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt, stream: false }),
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.error(`Ollama HTTP ${res.status}`);
        throw new Error(`HTTP ${res.status}`);
      }
      const body = (await res.json()) as { response?: string };
      const reply = body.response?.trim();
      if (!reply) throw new Error("Empty response");
      return reply;
    } catch (err) {
      this.logger.error(`Ollama error: ${(err as Error).message}`);
      throw new InternalServerErrorException("Ollama API error or unreachable");
    } finally {
      clearTimeout(timer);
    }
  }
}
