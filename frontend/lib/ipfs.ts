"server only";

import { PinataSDK } from "pinata";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL;

if (!PINATA_JWT) {
  throw new Error("PINATA_JWT is not defined");
}

if (!PINATA_GATEWAY) {
  throw new Error("NEXT_PUBLIC_GATEWAY_URL is not defined");
}

const gatewayDomain = PINATA_GATEWAY;

const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: gatewayDomain,
});

export async function uploadFileToIPFS(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const rawName = (file as { name?: string }).name;
  const fileName =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName
      : "memechain-upload";

  const normalizedFile = new File([arrayBuffer], fileName, {
    type: file.type || "application/octet-stream",
  });

  const upload = await pinata.upload.public.file(normalizedFile, {
    metadata: {
      name: fileName,
    },
  });

  const cid = upload.cid;

  return {
    cid,
    ipfsUri: `ipfs://${cid}`,
    gatewayUrl: `${gatewayDomain.replace(/\/$/, "")}/ipfs/${cid}`,
  };
}
