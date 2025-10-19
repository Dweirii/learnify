import { toast } from "sonner";
import { useEffect, useState } from "react";
import { JwtPayload, jwtDecode } from "jwt-decode";

import { createViewerToken } from "@/actions/token";

export const useViewerToken = (hostIdentity: string) => {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");

  useEffect(() => {
    const createToken = async () => {
      try {
        console.log("🔄 Creating viewer token for:", hostIdentity);
        const viewerToken = await createViewerToken(hostIdentity);
        console.log("✅ Token received:", viewerToken ? "YES" : "NO");
        setToken(viewerToken);

        const decodedToken = jwtDecode(viewerToken) as JwtPayload & { 
          name?: string;
          sub?: string;
        }
        const name = decodedToken?.name;
        const identity = decodedToken.sub || decodedToken.jti;

        console.log("👤 Decoded - Name:", name, "Identity:", identity);
        console.log("🔍 Full decoded token:", decodedToken);

        if (identity) {
          setIdentity(identity);
        }

        if (name) {
          setName(name);
        }

      } catch (error) {
        console.error("❌ Token error:", error);
        toast.error("Something went wrong");
      }
    }

    createToken();
  }, [hostIdentity]);

  return {
    token,
    name,
    identity,
  };
};
