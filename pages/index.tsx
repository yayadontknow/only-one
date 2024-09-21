// pages/index.tsx

import { useEffect, useState } from "react";
import Layout from "../components/layout";
import { signIn, signOut, useSession } from "next-auth/react"
import styles from "../components/header.module.css"

const generateRandomWord = (length: number): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const fetchNounImage = async (name: string): Promise<string> => {
  const url = `https://noun-api.com/beta/pfp?name=${name}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const svg = await response.text();
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch (error) {
    console.error("Error fetching the image:", error);
    return ""; // Ensure returning an empty string if there is an error
  }
};

export async function getServerSideProps() {
  const images: string[] = [];
  const rows = 5;
  const cols = 5;

  for (let i = 0; i < rows * cols; i++) {
    const randomName = generateRandomWord(5);
    const svgData = await fetchNounImage(randomName);
    if (svgData) {
      images.push(svgData);
    }
  }

  return { props: { images } };
}

export default function IndexPage({ images = [] }: { images?: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 1000); // Change image every 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [images]);

  return (
    <Layout>
      <div style={{ display: "flex", height: "100vh" }}>
        <div
          style={{
            flex: 1,
            border: "1px solid #ccc",
            backgroundImage: `url(${images[currentIndex]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <h1 >
    We help everyone to have an identity,<br />
    no matter if you are a shark, star, or even a hat!
  </h1>
  <h1 style={{ textAlign: "right", alignSelf: "flex-end", marginRight:"100px" }}>———— Identifiable</h1>
        <div style={{ display: "flex", flexDirection: "row"}}>
          

          <a
                href={"/api/auth/signin"}
                onClick={(e) => {
                  e.preventDefault()
                  signIn("worldcoin", { callbackUrl: "/protected" }) // when worldcoin is the only provider
                  // signIn() // when there are multiple providers
                }}
              ><button className="big-button">
              <img src="cc.png" alt="Icon" style={{ height: "100px", marginRight: "8px" }} />
              Enter
            </button>
            </a>

        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: "50px" }}>
  <h2 style={{ margin: 0, marginRight: "10px" }}>Powered by</h2>
  <img src="noun.jpg" alt="Logo" style={{ height: "40px", marginRight: "10px", borderRadius: "5px" }} />
  <img src="world.webp" alt="Logo" style={{ height: "40px", marginRight: "10px", borderRadius: "5px" }} />
  <img src="sign.webp" alt="Logo" style={{ height: "40px", marginRight: "10px", borderRadius: "5px" }} />
  <img src="dynamic.jpeg" alt="Logo" style={{ height: "40px", marginRight: "10px", borderRadius: "5px" }} />
  <img src="sepolia.png" alt="Logo" style={{ height: "40px", marginRight: "10px", borderRadius: "5px" }} />
</div>
      </div>
                
      </div>
    
    </Layout>
  );
}
