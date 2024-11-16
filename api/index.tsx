import { Button, Frog } from "frog";
import { handle } from "frog/vercel";
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

const farcasterDataMiddleware = farcasterDataFrogMiddleware({
  apiKey: process.env.AIRSTACK_API_KEY || "",
  features: {
    userDetails: {},
  },
  env: "dev",
});

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
    image: (
      <Box
        alignVertical="center"
        backgroundColor={vars.colors.white}
        justifyContent="center"
        padding="24"
        height="auto" // Changed from fixed height to auto for better responsiveness
        width="100%"
      >
        <Box
          backgroundColor={vars.colors.linear}
          borderRadius="24"
          padding="32"
          maxWidth="600"
          width="100%"
          textAlign="center"
          alignVertical="center"
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)" // Added shadow for depth
        >
          {/* Header Section */}
          <Text
            color={vars.colors.white}
            fontSize="24px"
            fontWeight="bold"
            marginBottom="16px"
          >
            Welcome to Gotcha!
          </Text>
          <Text
            color={vars.colors.linearBlur}
            fontSize="18px"
            marginBottom="32px"
          >
            Solve the CAPTCHA to claim your faucet rewards!
          </Text>

          <Spacer size="32" />

          <Box
            backgroundColor={vars.colors.purple}
            borderRadius="12"
            padding="16"
            width="100%"
            justifyContent="center"
            textAlign="center"
            marginBottom="24" // Added margin for spacing below the verification box
          >
            <Text color={vars.colors.white} fontSize="20px">
              Please verify you're human
            </Text>
          </Box>
        </Box>
      </Box>
    ),
    imageAspectRatio: "1.91:1",
    intents: [
      <Button action="/claim-faucet">Claim Faucet</Button>,
      <Button.Link href="https://github.com/gotcha-labs">Goptcha</Button.Link>,
    ],
  });
});
app.frame("/claim-faucet", (c) => {
  const random = Math.floor(Math.random() * 4) + 1;
  return c.res({
    image: `${process.env.NEXT_PUBLIC_SITE_URL}/${random}.gif`,
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
      image: (
        <Box
          alignVertical="center"
          backgroundColor={vars.colors.white}
          justifyContent="center"
          padding="46"
          height="100%"
          width="100%"
        >
          <Box
            backgroundColor={vars.colors.linear}
            borderRadius="24"
            padding="32"
            maxWidth="600"
            width="100%"
            textAlign="center"
            alignVertical="center"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
          >
            <Text
              color={vars.colors.purple}
              fontSize="24px"
              fontWeight="bold"
              marginBottom="16px"
            >
              Congratulations!
            </Text>
            <Text
              color={vars.colors.linearBlur}
              fontSize="18"
              marginBottom="32"
            >
              Claim on baseSepolia Chain
            </Text>
          </Box>
        </Box>
      ),
      imageAspectRatio: "1.91:1",
      action: "/success",
      intents: [
        <Button.Transaction target="/mint">claim Faucet </Button.Transaction>,
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
    image: (
      <div
        style={{
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyItems: "center",
          alignItems: "center",
          fontSize: 60,
        }}
      >
        {transactionId
          ? `tnx : ${transactionId.slice(0, 3)}...${transactionId.slice(-3)}`
          : "Transaction ..."}
      </div>
    ),
    imageAspectRatio: "1.91:1",
    action: "/success",
    intents: [
      <Button.Link
        key="hash"
        href={`https://base-sepolia.blockscout.com/tx/${transactionId}`}
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
      chainId: "eip155:84532",
      functionName: "mintFaucet",
      args: [],
      to: "0x0A7dC674c876167bA3920D6d729895A52f6701B1",
      value: BigInt(0),
    });
  } catch (error) {
    console.error("Error fetching passport data:", error);
    return c.error({
      message: "You can claim after 24hours again",
    });
  }
});

// devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
