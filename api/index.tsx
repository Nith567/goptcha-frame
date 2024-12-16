import { Button, Frog } from "frog";
import { handle } from "frog/next";
import {
  Box,
  Image,
  Column,
  Divider,
  Text,
  Spacer,
  vars,
  VStack,
} from "../lib/ui.js";
import axios from "axios";
import sharp from "sharp";
import https from "https";
import dotenv from "dotenv";
import { farcasterDataFrogMiddleware } from "@airstack/frames";
import { ABI } from "../lib/abi.js";

// Uncomment this packages to tested on local server
// import { devtools } from "frog/dev";
// import { serveStatic } from "frog/serve-static";

// Load environment variables from .env file
dotenv.config();

interface UserDetails {
  profileName?: string | null;
  fnames?: (string | null)[] | null;
  userAssociatedAddresses?: string[] | null;
  followerCount?: number | null;
  followingCount?: number | null;
  profileImage?: {
    extraSmall?: string;
    small?: string;
    medium?: string;
    large?: string;
    original?: string;
  } | null;
  connectedAddresses?: {
    address: string;
    blockchain: string;
    chainId: string;
    timestamp: string;
  }[];
}

// Initialize Frog App
export const app = new Frog({
  assetsPath: "/",
  basePath: "/api/frame",
  ui: { vars },
  title: "Faucet",
  imageAspectRatio: "1:1",
  headers: {
    "cache-control":
      "no-store, no-cache, must-revalidate, proxy-revalidate max-age=0, s-maxage=0",
  },
  imageOptions: {
    height: 600,
    width: 500,
  },
  hub: {
    apiUrl: "https://hubs.airstack.xyz",
    fetchOptions: {
      headers: {
        "x-airstack-hubs": process.env.AIRSTACK_API_KEY || "",
      },
    },
  },
});

app.frame("/", (c) => {
  return c.res({
    image: `${process.env.NEXT_PUBLIC_SITE_URL}/gotcha.jpg`,
    imageAspectRatio: "1.91:1",
    intents: [<Button action="/claim-faucet">Claim Faucet</Button>],
  });
});

const imageDirections: { [key: string]: string } = {
  1: `${process.env.NEXT_PUBLIC_SITE_URL}/north.gif`,
  2: `${process.env.NEXT_PUBLIC_SITE_URL}/2.gif`,
  3: `${process.env.NEXT_PUBLIC_SITE_URL}/3.gif`,
  4: `${process.env.NEXT_PUBLIC_SITE_URL}/4.gif`,
};

app.frame("/claim-faucet", (c) => {
  const random = Math.floor(Math.random() * 4) + 1;
  return c.res({
    image: `${imageDirections[random]}`,
    imageAspectRatio: "1.91:1",
    intents: [
      <Button action={`/N/${random}`}>North</Button>,
      <Button action={`/S/${random}`}>South</Button>,
      <Button action={`/E/${random}`}>East</Button>,
      <Button action={`/W/${random}`}>West</Button>,
    ],
  });
});

const directionMapping: { [key: string]: string } = {
  1: "N",
  2: "S",
  3: "E",
  4: "W",
};

app.frame("/:direction/:id", (c) => {
  const direction = c.req.param("direction");
  if (direction == directionMapping[c.req.param("id")]) {
    return c.res({
      image: `${process.env.NEXT_PUBLIC_SITE_URL}/gotcha-end-successful.gif`,
      imageAspectRatio: "1.91:1",
      action: "/success",
      intents: [
        <Button.Transaction target="/mint">Claim Faucet </Button.Transaction>,
      ],
    });
  } else {
    return c.error({
      message: "Try again, captcha failed",
    });
  }
});
app.frame("/success", (c) => {
  const { transactionId } = c;
  return c.res({
    image: `${process.env.NEXT_PUBLIC_SITE_URL}/gotcha.jpg`,
    imageAspectRatio: "1.91:1",
    action: "/success",
    intents: [
      <Button.Link
        key="hash"
        href={`https://polygonscan.com/tx/${transactionId}`}
      >
        View on Block Explorer
      </Button.Link>,
      <Button action="/">Home</Button>,
    ],
  });
});
app.transaction("/mint", (c) => {
  try {
    return c.contract({
      abi: ABI,
      chainId: "eip155:137",
      functionName: "claimFaucet",
      args: [],
      to: "0x491535778d056ad7324605753730291cbd83fca0",
      value: BigInt(0),
    });
  } catch (error) {
    return c.error({
      message: "You can claim after 24hours again",
    });
  }
});

// devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
