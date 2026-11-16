import { AwsClient } from "aws4fetch";

export function getSnapshotStore(env = process.env) {
  const address = env.RAWBLOCK_HERO_SNAPSHOT_URL?.trim();
  const accessKeyId = env.RAWBLOCK_HERO_SNAPSHOT_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.RAWBLOCK_HERO_SNAPSHOT_SECRET_ACCESS_KEY?.trim();
  if (!address || !accessKeyId || !secretAccessKey) return null;

  let url;
  try {
    url = new URL(address);
  } catch {
    return null;
  }
  const r2 = url.protocol === "https:" && /^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/.test(url.hostname) && !url.port;
  const loopback = env.VERCEL !== "1" && url.protocol === "http:" && url.hostname === "127.0.0.1";
  if ((!r2 && !loopback) || url.username || url.password || url.search || url.hash ||
      !/^\/[a-z0-9][a-z0-9-]*\/hero\/v1\/latest\.json$/.test(url.pathname)) return null;

  return {
    url: url.href,
    client: new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" }),
  };
}
