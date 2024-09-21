import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Layout from "../components/layout";
import AccessDenied from "../components/access-denied";
import axios from 'axios';
const snarkjs = require('snarkjs');
import { ethers } from 'ethers'; // Import ethers.js
import styles from "../components/header.module.css"
import {  initializeSignClient, initializeIndexService, createAttestation, queryAttestationsByWalletAddress} from './attestation';



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

const ConnectWalletButton: React.FC = () => {

  // Initialize ethers provider and contract
  // const initEthers = async () => {
  //   if (window.ethereum) {
  //     await window.ethereum.enable(); // or window.ethereum.request({ method: 'eth_requestAccounts' });
      
  //     const newProvider = new ethers.BrowserProvider(window.ethereum);
  //     const signer = await newProvider.getSigner(); // Await the promise to get the signer
  //     const newContract = new ethers.Contract(contractAddress, contractABI, signer);
  //     setContract(newContract);
  //     setProvider(newProvider);
  //     console.log("New Contract Initialized:", newContract);
  //   } else {
  //     console.error("Ethereum provider not found.");
  //   }
  // };
  // initEthers();

  
};

export default function ProtectedPage({ images = [] }: { images?: string[] }) {

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 1000); // Change image every 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [images]);
  
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [nationalId, setNationalId] = useState("");
  const [disabilityStatus, setDisabilityStatus] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [proof, setProof] = useState(null);
  const [publicSignals, setPublicSignals] = useState(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [attestation, setAttestation] = useState(null);
  const contractAddress = '0x3c5966e096f24b2a09a3e9bbf89ae8d576ab15e4'; // Replace with your contract address
  const contractABI = [
    {
      "inputs": [
        {
          "internalType": "uint256[2]",
          "name": "_pA",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256[2][2]",
          "name": "_pB",
          "type": "uint256[2][2]"
        },
        {
          "internalType": "uint256[2]",
          "name": "_pC",
          "type": "uint256[2]"
        },
        {
          "internalType": "uint256[1]",
          "name": "_pubSignals",
          "type": "uint256[1]"
        }
      ],
      "name": "verifyProof",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const connectWallet = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.enable(); // Request account access

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        console.log("Connected wallet address:", address);


        // Store the wallet address globally
        setWalletAddress(address);
        const proofForContract = [
        proof.pi_a.slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`),
        [
          proof.pi_b[0].slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`),
          proof.pi_b[1].slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`)
        ],
        proof.pi_c.slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`)
      ];
      const data = {
        walletAddress: address,
        pA: proofForContract[0],
        pB_1: proofForContract[1][0],
        pB_2: proofForContract[1][1],
        pC: proofForContract[2],
        expiredDate: Math.floor(Date.now() / 1000) + 31536000,
    };
    const signClient = await initializeSignClient();
    await createAttestation(signClient, address, data);
    const indexService = await initializeIndexService();
    const attestation = await queryAttestationsByWalletAddress(indexService, address);
    console.log(attestation);
    
    // setAttestation(attestation);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this feature.");
    }

  }

  useEffect(() => {
    if (session) {
      setStep(1);
      // Initialize ethers provider and contract
      const initEthers = async () => {
        if (window.ethereum) {
          await window.ethereum.enable(); // or window.ethereum.request({ method: 'eth_requestAccounts' });
          
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          const signer = await newProvider.getSigner(); // Await the promise to get the signer
          const newContract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(newContract);
          setProvider(newProvider);
          console.log("New Contract Initialized:", newContract);
        } else {
          console.error("Ethereum provider not found.");
        }
      };
      initEthers();
    } else {
      setStep(0);
    }
  }, [session]);

  const handleNationalIdSubmit = async () => {
    try {
      const response = await fetch('http://localhost:3500/api/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId })
      });

      const data = await response.json();
      console.log("data: " + data.profileImg);
      if (data.isVerified) {
        setIsVerified(true);
        setDisabilityStatus(data.disabilityStatus);
        setFaceImage(data.profileImg);
        setStep(2);
      } else {
        setErrorMessage("National ID verification failed.");
      }
    } catch (error) {
      console.error('Error verifying national ID:', error);
    }
  };

  const startCamera = async () => {
    try {
      setCameraStarted(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play(); // Ensure the video starts playing
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Error accessing camera. Please ensure permissions are granted.');
    }
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Check if video dimensions are available
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video element is not ready. Ensure the camera is started.');
      return null; // Exit if video is not ready
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg');
  };

  const dataURLtoFile = (dataURL, filename) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }

    return new File([u8arr], filename, { type: mime });
  };

  const handleFaceRecognition = async () => {
    try {
      const capturedImageDataURL = captureImage();
      if (!capturedImageDataURL) {
        console.error('No image captured. Check the video or canvas elements.');
        return;
      }
  
      const capturedImageFile = dataURLtoFile(capturedImageDataURL, 'capturedImage.jpg');
      const formData = new FormData();
      formData.append('capturedImage', capturedImageFile);
      formData.append('nationalId', nationalId);
  
      const response = await axios.post('http://localhost:3500/api/compare-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('API Response:', response.data); // Log the raw response data
  
      // Ensure that response.data is an object
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  
      const a = data.embedding1;
      const b = data.embedding2;
      
      console.log({ "embedding1": a.toString(16), "embedding2": b.toString(16) });
  
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        { "embedding1": [a], "embedding2": [b] },
        "face.wasm",
        "face_0001.zkey"
      );

      const vKey = {
        "protocol": "groth16",
        "curve": "bn128",
        "nPublic": 1,
        "vk_alpha_1": [
         "5350901180740880361491433990242223631831896848835160413014021726111520464650",
         "10681375984431727394561942932047241533218164387303573422439748074970837367605",
         "1"
        ],
        "vk_beta_2": [
         [
          "14367658691668664792861331386493749700876932393400165181791580546142945795809",
          "1461715643772485795753345108062561704175487329290655867112199973020779331392"
         ],
         [
          "9318431410817742095944753570352110938399331117357357849608902800647376628129",
          "16372438214948558711183763391955008833927506994745942492020124576363465740024"
         ],
         [
          "1",
          "0"
         ]
        ],
        "vk_gamma_2": [
         [
          "10857046999023057135944570762232829481370756359578518086990519993285655852781",
          "11559732032986387107991004021392285783925812861821192530917403151452391805634"
         ],
         [
          "8495653923123431417604973247489272438418190587263600148770280649306958101930",
          "4082367875863433681332203403145435568316851327593401208105741076214120093531"
         ],
         [
          "1",
          "0"
         ]
        ],
        "vk_delta_2": [
         [
          "14827475427889179338394103377380988835009968452249462801981811538945788322510",
          "521436569431208265228940850690011630158931951020846490860788636327206534706"
         ],
         [
          "8890758832862913277927804424644342132640584818469351217362290235659800822523",
          "1758224327316144801292188036043875980822808441710476428558789669845400667144"
         ],
         [
          "1",
          "0"
         ]
        ],
        "vk_alphabeta_12": [
         [
          [
           "18595441593178161633401392114299236492023879356964077700091573165340878610395",
           "18327803200202841851182145738227339560479394694094193049321063708253297363871"
          ],
          [
           "17357349138133453158749043427998400590363601672792169846137649781293226108412",
           "16017295460085268223594387002163867649246863144544284788565936108255267142537"
          ],
          [
           "651826214681556104385242355962643100016927534957366999362758565455303551041",
           "11593641743635699527446650777800052419529660939140186762003373444186488446441"
          ]
         ],
         [
          [
           "2586512989921392593542326923392745255280390898785354652549413868314178833372",
           "11883121912489191248998547818588826031804693578458400213261903121634556568964"
          ],
          [
           "8910360451864652536672565653051963552063779923294251970818225489656022764783",
           "6779333663092894336290323981327825033629455805266905939152562309641099762943"
          ],
          [
           "14656413916150368851166440585212899653147651503998562911008255629820014117430",
           "2638334231263976017602306248843250420334765802763440543643972279800314257723"
          ]
         ]
        ],
        "IC": [
         [
          "11197497701163719878298062546292352600587815602110346632607243751684053776810",
          "17860257613165089582464490036587405211532424755739974405016109593569947826247",
          "1"
         ],
         [
          "11098177034848386137236257500557643538131588916235505446580860219076866787005",
          "3619718241579091004164928516345866067335440379575351205097803164561830235122",
          "1"
         ]
        ]
       };
      const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      if(verified)
      {
        setProof(proof);
        setPublicSignals(publicSignals);
      }
      console.log("Verification result:", verified);


  
      // const proofForContract = [
      //   proof.pi_a.slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`),
      //   [
      //     proof.pi_b[0].slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`),
      //     proof.pi_b[1].slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`)
      //   ],
      //   proof.pi_c.slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`)
      // ];
  
      // console.log('Proof for Contract:', JSON.stringify(proofForContract));
  
      // const publicSignalsHex = publicSignals.map(signal => `0x${BigInt(signal).toString(16)}`);
      // console.log("Public Signals in Hex:", JSON.stringify(publicSignalsHex));
      // if (!contract) {
      //   console.error("Contract is not initialized yet.");
      //   return;
      // }
      
      // const isValid = await contract.verifyProof(proofForContract[0], proofForContract[1], proofForContract[2], publicSignalsHex);
      // console.log('Proof verification result:', isValid); // Wait for transaction to be mined
       // Move to completion step
       console.log("signal: " + publicSignals)
      if (verified && publicSignals==1) {
        setStep(4);
        
      } else {
        setStep(5);
      }
    } catch (error) {
      console.error('Error during face recognition:', error.response ? error.response.data : error.message);
    }
  };
  
  

  const generateProof = async () => {
    console.log('Generating proof...');
    try {
      // Assume you already have proof and public signals from the face recognition step
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        { /* your inputs here */ },
        "face.wasm",
        "face_0001.zkey"
      );

      // Convert proof and public signals to format required by contract
      const proofForContract = [
        proof.pi_a.slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`),
        [
          proof.pi_b[0].slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`),
          proof.pi_b[1].slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`)
        ],
        proof.pi_c.slice(0, 2).map(x => `0x${BigInt(x).toString(16)}`)
      ];

      // const publicSignalsHex = publicSignals.map(signal => `0x${BigInt(signal).toString(16)}`);
      const publicSignalsHex = "0x0000000000000000000000000000000000000000000000000000000000000001";

      // Send proof and public signals to contract
      const tx = await contract.verifyProof(proofForContract[0], proofForContract[1], proofForContract[2], publicSignalsHex);
      await tx.wait(); // Wait for transaction to be mined

      console.log('Proof submitted to contract:', tx);
      setStep(4); // Move to completion step

    } catch (error) {
      console.error('Error generating proof:', error);
      setErrorMessage('Error generating proof. Please try again.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <p>Please sign in to begin the verification process.</p>
          </div>
        );
      case 1:
        return (
//           <div >
  
  
  
// </div>
<div>
<h1 style={{ textAlign: "center" }}>Handicapped Proof Generation</h1>
<h1 style={{ textAlign: "center" }}>We let everyone trust you in an easy and simple way with Zero Knowledge Proof.</h1>
<div style={{ display: "flex", width: "100%", height:"80px", paddingLeft:"36px", paddingRight:"36px" }} className="wrapper">

<input
    type="text"
    placeholder="Enter National ID"
    value={nationalId}
    onChange={(e) => setNationalId(e.target.value)}
    style={{ flex: "9", padding: "10px 46px 10px 46px", fontSize: "16px" }} // 90% width
  />
    <button
    onClick={handleNationalIdSubmit}
    style={{ flex: "1", padding: "10px 46px 10px 46px", fontSize: "16px" }} // 10% width
  >
    Submit
  </button>
  {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
</div></div>
        );

      case 2:
        return (
          <div>
      <h1 style={{ textAlign: "center" }}>Handicapped Proof Generation</h1>
      <h1 style={{ textAlign: "center" }}>We let everyone trust you in an easy and simple way with Zero Knowledge Proof.</h1>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
              {/* Left Gray Square */}
              <div>
              <div style={{
                flex: 1,
                backgroundColor: '#F2F2F2',
                borderRadius: '10px',
                margin: '0 5px',
                height: '500px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {faceImage && (
                  <img src={faceImage} alt="Profile" style={{ maxWidth: '80%', maxHeight: '80%' }} />
                )}
                
              </div>
              <p><b>The profile image is retrieved from government website using api call and only disabled person's image is stored in it.</b></p>
              </div>
              {/* Right Gray Square */}
              <div style={{
                flex: 1,
                backgroundColor: '#F2F2F2',
                borderRadius: '10px',
                margin: '0 5px',
                height: '500px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}>
                {!cameraStarted && (

                  <button className="big-button" onClick={startCamera} style={{ padding: "0px", marginBottom:"0px"}}>
                  <img src="camera.png" alt="Icon" style={{ height: "100px"}} />
                  </button>
                )}
      
                {cameraStarted && (
                  <video ref={videoRef} autoPlay style={{ maxWidth: '80%', maxHeight: '80%' }} />
                )}
              </div>
            </div>
      
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
  <button className="big-button" onClick={handleFaceRecognition}>
    Generate Proof
  </button>
</div>

          </div>
        );
        
        
        
        
        
      case 3:
        return (
          <div>
            <h2>Generate Proof</h2>
            <p>Face recognition successful. Similarity Score: {similarityScore}</p>
            <button onClick={generateProof}>Generate Proof</button>
          </div>
        );
      case 4:
        return (
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
    You are identified!<br />
    Now, connect your wallet.
  </h1>
  <h1 style={{ textAlign: "right", alignSelf: "flex-end", marginRight:"100px" }}>———— Identifiable</h1>

    <div style={{ display: "flex", flexDirection: "row" }}>
      <button className="big-button" onClick={connectWallet}>
        <img src="cc.png" alt="Icon" style={{ height: "100px", marginRight: "8px" }} />
        Connect Wallet
      </button>
      <div style={{ display: "flex", alignItems: "center", marginTop: "50px" }}>
        <h2 style={{ margin: 0, marginRight: "10px" }}>Powered by</h2>
        <img src="noun.jpg" alt="Logo" style={{ height: "40px", marginRight: "10px", borderRadius: "5px" }} />
        <img src="world.webp" alt="Logo" style={{ height: "40px", marginRight: "10px", borderRadius: "5px" }} />
      </div>
    </div>
  );
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
        );
      case 5:
          return (
            <div>
              <h2>Verification Incomplete</h2>
              <p>Proof is not generated.</p>
            </div>
          );
      default:
        return null;
    }
  };

  // If no session exists, display access denied message
  if (!session) {
    return (
      <Layout>
        <AccessDenied />
      </Layout>
    );
  }

  // If session exists, display the verification flow
  return (
    <Layout>

  {renderStep()}
</Layout>
  );

}
