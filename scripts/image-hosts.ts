import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const images = await prisma.productImage.findMany({ select: { url: true } });
  const hosts: Record<string, number> = {};
  const samples: string[] = [];
  for (const { url } of images) {
    try {
      const host = new URL(url).hostname;
      hosts[host] = (hosts[host] ?? 0) + 1;
      if (samples.length < 4 && !samples.some((s) => s.includes(host))) samples.push(url);
    } catch {
      hosts["(invalid)"] = (hosts["(invalid)"] ?? 0) + 1;
    }
  }
  console.log(JSON.stringify(hosts, null, 2));
  console.log("total:", images.length);
  console.log(samples.join("\n"));
}

main().finally(() => prisma.$disconnect());
