import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as Minio from "minio";
import { randomUUID } from "crypto";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client;
  private readonly bucket = process.env.MINIO_BUCKET || "products";
  private readonly publicUrl =
    process.env.MINIO_PUBLIC_URL || "http://localhost:9000";

  onModuleInit() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    });
    // Bucket dibuat async agar startup tidak crash bila MinIO belum siap
    this.ensureBucket().catch((err) =>
      this.logger.error(`MinIO init gagal: ${err.message}`),
    );
  }

  private async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, "");
    }
    const publicReadPolicy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    });
    await this.client.setBucketPolicy(this.bucket, publicReadPolicy);
    this.logger.log(`Bucket "${this.bucket}" siap (public-read)`);
  }

  /** Upload buffer, return URL publik yang bisa diakses browser. */
  async upload(
    buffer: Buffer,
    originalName: string,
    contentType: string,
  ): Promise<{ objectName: string; url: string }> {
    const ext = originalName.includes(".")
      ? originalName.substring(originalName.lastIndexOf("."))
      : "";
    const objectName = `${randomUUID()}${ext}`;
    await this.client.putObject(
      this.bucket,
      objectName,
      buffer,
      buffer.length,
      {
        "Content-Type": contentType,
      },
    );
    return {
      objectName,
      url: `${this.publicUrl}/${this.bucket}/${objectName}`,
    };
  }

  async delete(objectNameOrUrl: string): Promise<void> {
    const objectName = objectNameOrUrl.startsWith("http")
      ? (objectNameOrUrl.split(`/${this.bucket}/`).pop() ?? "")
      : objectNameOrUrl;
    if (!objectName) return;
    try {
      await this.client.removeObject(this.bucket, objectName);
    } catch (err) {
      this.logger.warn(
        `Gagal hapus objek ${objectName}: ${(err as Error).message}`,
      );
    }
  }
}
