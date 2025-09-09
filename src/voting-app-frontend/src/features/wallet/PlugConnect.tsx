import React, { useState, useEffect } from 'react';
import { Actor,  } from '@dfinity/agent';
import { idlFactory as icrc1IdlFactory } from '../../../../declarations/ledger';

const MAINNET_LEDGER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";

const LOCAL_LEDGER_ID = "u6s2n-gx777-77774-qaaba-cai"; 

const isLocal = window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1");
const ICP_LEDGER_CANISTER_ID = isLocal ? LOCAL_LEDGER_ID : MAINNET_LEDGER_ID;


const truncate = (text: string, chars: number = 5): string => {
  if (!text) return "";
  return `${text.slice(0, chars)}...${text.slice(-chars)}`;
};

const PlugConnect: React.FC = () => {
  const [principalId, setPrincipalId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [icpBalance, setIcpBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchData = async () => {
    if (!window.ic?.plug?.agent) return;
    setIsLoading(true);

    const agent = window.ic.plug.agent;
    const principal = await agent.getPrincipal();
    
    setPrincipalId(principal.toText());
    
    try {
      const ledgerActor = Actor.createActor(icrc1IdlFactory, {
        agent,
        canisterId: ICP_LEDGER_CANISTER_ID,
      });
      const balanceBigInt = await ledgerActor.icrc1_balance_of({ owner: principal, subaccount: [] }) as bigint;
      const balance = Number(balanceBigInt) / 10**8;
      setIcpBalance(balance.toFixed(6));
    } catch (error) {
      console.error("Gagal mengambil saldo:", error);
      setIcpBalance("Error");
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    const verifyConnection = async () => {
      const connected = await window.ic?.plug?.isConnected();
      if (connected) {
        setIsConnected(true);
        await fetchData();
      }
    };
    window.addEventListener('load', verifyConnection);
    return () => window.removeEventListener('load', verifyConnection);
  }, []);

  const handleConnect = async () => {
    if (!window.ic?.plug) {
      window.open('https://plugwallet.ooo/', '_blank');
      return;
    }
    try {
      await window.ic.plug.requestConnect({ whitelist: [] });
      setIsConnected(true);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnect = async () => {
    await window.ic?.plug?.disconnect();
    setIsConnected(false);
    setPrincipalId('');
    setIcpBalance('0.00');
  };

  return (
    <div className="plug-connect-container">
      {!isConnected ? (
        <button onClick={handleConnect} className="connect-button">
          Connect Plug Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <h4>Wallet Connected</h4>
          <p>
            <strong>Principal ID:</strong> <span>{truncate(principalId)}</span>
          </p>
          <p>
            <strong>Balance:</strong> 
            <span> {isLoading ? 'Loading...' : `${icpBalance} ICP`} </span>
            <button onClick={fetchData} disabled={isLoading} className="refresh-button">
              🔄
            </button>
          </p>
          <button onClick={handleDisconnect} className="disconnect-button">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default PlugConnect;