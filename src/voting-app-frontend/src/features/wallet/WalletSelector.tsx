import { useState } from "react";
import { Button, HStack, Text } from "@chakra-ui/react";
import { loginII, loginNFID, loginPlug, WalletType } from "@/ic/auth";

export default function WalletSelector({ onConnected }: { onConnected: (x:{identity:any; actor:any; wallet:WalletType})=>void }) {
  const [loading, setLoading] = useState<WalletType | null>(null);
  const connect = async (w: WalletType) => {
    setLoading(w);
    try {
      const fn = w==="II" ? loginII : w==="NFID" ? loginNFID : loginPlug;
      const res = await fn();
      onConnected({ ...res, wallet: w });
    } catch (e:any) { alert(e?.message ?? "Gagal konek wallet"); }
    finally { setLoading(null); }
  };
  return (
    <HStack>
      <Button loading={loading==="II"} onClick={()=>connect("II")}>Internet Identity</Button>
      <Button loading={loading==="NFID"} onClick={()=>connect("NFID")}>NFID</Button>
      <Button loading={loading==="PLUG"} onClick={()=>connect("PLUG")}>Plug</Button>
      <Text fontSize="sm" color="gray.500">Pilih salah satu untuk mulai.</Text>
    </HStack>
  );
}