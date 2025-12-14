import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { TokenInput } from './TokenInput';
import { TokenSelectModal } from './TokenSelectModal';
import { ChainSelector } from '../ChainSelector/ChainSelector';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { useTokenList } from '../../../hooks/useTokenList';
import { SwapConfirmationDialog } from './SwapConfirmationDialog';
import { Token } from '../../../types/api';
import { useSwapExecution } from '../../../hooks/useSwapExecution';
import { useSwap } from '../../../hooks/useSwap';
import { changelly } from '../../../services/ChangellyService';
import { TransactionSuccessModal } from './TransactionSuccessModal';

// Token Approval component interface
interface TokenApprovalCardProps {
  tokenSymbol: string;
  onApprove: () => void;
  onCancel: () => void;
  isApproving: boolean;
}

// TokenApprovalCard component
const TokenApprovalCard: React.FC<TokenApprovalCardProps> = ({ 
  tokenSymbol, 
  onApprove, 
  onCancel,
  isApproving 
}) => (
  <div className="p-4 bg-yellow-50 border border-yellow-400 rounded-lg mb-4">
    <h3 className="font-bold text-yellow-800">Token Approval Required</h3>
    <p className="my-2 text-yellow-700">
      To swap {tokenSymbol}, you need to approve the DEX to use your tokens.
    </p>
    <div className="flex justify-between mt-4">
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
      <button
        onClick={onApprove}
        disabled={isApproving}
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-300"
      >
        {isApproving ? 'Approving...' : `Approve ${tokenSymbol}`}
      </button>
    </div>
  </div>
);

interface SwapCardProps {
  onClose?: () => void;
}

interface ApprovalData {
  tokenAddress: string;
  spenderAddress: string;
  amount: string;
  chainId: number;
  tokenSymbol: string;
}

// Native token address map
const NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const NATIVE_TOKENS: Record<number, { symbol: string, wrappedAddress?: string }> = {
  1: { symbol: 'ETH', wrappedAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
  56: { symbol: 'BNB', wrappedAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' },
  137: { symbol: 'MATIC', wrappedAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270' },
  42161: { symbol: 'ETH', wrappedAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1' }
};

export const SwapCard: React.FC<SwapCardProps> = ({ onClose }) => {
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [selectingToken, setSelectingToken] = useState<'from' | 'to' | null>(null);
  const [inputError, setInputError] = useState<string>('');
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [tokenPair, setTokenPair] = useState<any>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    slippage,
    loading: priceLoading,
    error: priceError,
    priceGraphData,
    setFromToken,
    setToToken,
    setFromAmount,
    setSlippage,
    fetchBalances: fetchApiBalances
  } = useSwap();

  const {
    isApproving,
    needsApproval,
    error: swapError,
    executeSwap,
    approveToken,
    checkAllowance
  } = useSwapExecution();

  const [approvalData, setApprovalData] = useState<ApprovalData | null>(null);
  const [userBalances, setUserBalances] = useState<Record<string, string>>({});

  // Fetch tokens using the hook for the current chain
  const { tokens, loading: tokenLoading, error: tokenError, fetchTokens } = useTokenList(chain?.id);

  // Use wagmi's useBalance hook to get native token balance directly from wallet
  const { 
    data: nativeBalance, 
    isLoading: isLoadingNativeBalance,
    refetch: refetchNativeBalance
  } = useBalance({
    address: isConnected ? address : undefined,
    chainId: chain?.id,
    watch: true, // Auto update when balance changes
  });

  // Function to format balance with appropriate precision
  const formatBalance = (balance?: string | number, decimals = 4): string => {
    if (!balance) return '0.0000';
    
    const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance;
    if (isNaN(balanceNum)) return '0.0000';
    
    // Use scientific notation for extremely small numbers
    if (balanceNum < 0.000001) return balanceNum.toExponential(4);
    
    // For very small numbers, use 6 decimal places
    if (balanceNum < 0.001) return balanceNum.toFixed(6);
    
    // For normal numbers, use standard decimal places
    return balanceNum.toFixed(decimals);
  };

  // Function to fetch balances from multiple sources
  const fetchUserBalances = async (): Promise<Record<string, string>> => {
    if (!isConnected || !address || !chain?.id) return {};
    
    setIsLoadingBalances(true);
    
    try {
      // Start with an empty balances object
      const newBalances: Record<string, string> = {};
      
      // Add native token balance from wagmi if available
      if (nativeBalance) {
        const formattedBalance = nativeBalance.formatted;
        
        // Store the balance under multiple keys for easier lookup
        newBalances[NATIVE_TOKEN_ADDRESS] = formattedBalance;
        newBalances[NATIVE_TOKEN_ADDRESS.toLowerCase()] = formattedBalance;
        
        // Add balance under token symbol
        if (chain.id in NATIVE_TOKENS) {
          const symbol = NATIVE_TOKENS[chain.id].symbol;
          newBalances[symbol] = formattedBalance;
          newBalances[symbol.toUpperCase()] = formattedBalance;
          newBalances[symbol.toLowerCase()] = formattedBalance;
          
          // Add for wrapped token address too
          if (NATIVE_TOKENS[chain.id].wrappedAddress) {
            newBalances[NATIVE_TOKENS[chain.id].wrappedAddress!] = formattedBalance;
            newBalances[NATIVE_TOKENS[chain.id].wrappedAddress!.toLowerCase()] = formattedBalance;
          }
        }
        
        // console.log(`Native ${nativeBalance.symbol} balance from wallet: ${formattedBalance}`);
      } else {
        // If nativeBalance isn't available yet, try to refresh it
        refetchNativeBalance();
      }
      
      // Try to fetch other token balances from API
      try {
        const response = await changelly.getBalances(chain.id, address);
        
        if (response.data) {
          // console.log('API balance response:', response.data);
          
          // Merge API balances into our balances object
          if (typeof response.data === 'object') {
            // Handle array format
            if (Array.isArray(response.data)) {
              response.data.forEach(item => {
                if (item.address && item.balance) {
                  // Convert wei to ether format if needed
                  const decimals = 18; // Assuming 18 decimals as default
                  let formattedBalance;
                  
                  if (item.balance.length > decimals) {
                    const decimalPosition = item.balance.length - decimals;
                    formattedBalance = 
                      item.balance.substring(0, decimalPosition) + '.' + 
                      item.balance.substring(decimalPosition);
                  } else {
                    const leadingZeros = decimals - item.balance.length;
                    formattedBalance = '0.' + '0'.repeat(leadingZeros) + item.balance;
                  }
                  
                  newBalances[item.address] = formattedBalance;
                  newBalances[item.address.toLowerCase()] = formattedBalance;
                }
              });
            } 
            // Handle object format
            else {
              Object.entries(response.data).forEach(([tokenAddress, balance]) => {
                if (balance) {
                  newBalances[tokenAddress] = String(balance);
                  newBalances[tokenAddress.toLowerCase()] = String(balance);
                }
              });
            }
          }
        }
      } catch (apiErr) {
        // console.error("Error fetching API balances:", apiErr);
      }
      
      // Update the balances state
      // console.log("Final user balances:", newBalances);
      setUserBalances(newBalances);
      
      // Validate current fromAmount against new balance
      if (fromToken && fromAmount) {
        validateAmount(fromAmount, fromToken, newBalances);
      }
      
      return newBalances;
    } catch (err) {
      // console.error("Error fetching balances:", err);
      toast.error("Failed to load your token balances");
      return userBalances;
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Validate if amount exceeds balance
  const validateAmount = (amount: string, token?: Token, balances = userBalances): boolean => {
    if (!amount || !token) {
      setInputError('');
      return true;
    }
    
    // Special case: If we have a native balance from wallet, use it for native tokens
    if (isNativeToken(token) && nativeBalance) {
      if (parseFloat(amount) > parseFloat(nativeBalance.formatted)) {
        setInputError(`Insufficient ${token.symbol} balance. Max: ${formatBalance(nativeBalance.formatted)} ${token.symbol}`);
        return false;
      }
      setInputError('');
      return true;
    }
    
    // Try multiple possible addresses for this token
    const possibleAddresses = [
      token.address,
      token.address.toLowerCase(),
      // For native tokens, also check the canonical address and symbol
      ...(isNativeToken(token) ? 
        [NATIVE_TOKEN_ADDRESS, token.symbol, token.symbol.toUpperCase(), token.symbol.toLowerCase()] : [])
    ];
    
    // Find the first address that has a balance
    let balance: string | undefined;
    for (const addr of possibleAddresses) {
      if (balances[addr]) {
        balance = balances[addr];
        // console.log(`Found balance for ${token.symbol} under address ${addr}: ${balance}`);
        break;
      }
    }
    
    if (!balance) {
      // console.log(`No balance found for token: ${token.symbol} (${token.address})`);
      // console.log('Available balance addresses:', Object.keys(balances));
      setInputError('');
      return true; // Don't block transactions if we can't determine balance
    }

    try {
      const inputValue = parseFloat(amount);
      const balanceValue = parseFloat(balance);

      if (isNaN(inputValue) || isNaN(balanceValue)) {
        // console.log(`Invalid number conversion: input=${amount}, balance=${balance}`);
        setInputError('');
        return true;
      }

      if (inputValue > balanceValue) {
        // Format the max balance for display
        let displayBalance = formatBalance(balanceValue);
        
        setInputError(`Insufficient balance. Max: ${displayBalance} ${token.symbol}`);
        return false;
      } else {
        setInputError('');
        return true;
      }
    } catch (error) {
      // console.error("Error validating amount:", error);
      setInputError('Invalid amount');
      return false;
    }
  };

  // Helper to check if a token is a native token (ETH, BNB, etc.)
  const isNativeToken = (token?: Token): boolean => {
    if (!token || !chain?.id) return false;
    
    const nativeSymbol = NATIVE_TOKENS[chain.id]?.symbol;
    
    return (
      token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ||
      token.symbol.toUpperCase() === nativeSymbol?.toUpperCase()
    );
  };

  // Add helper to return token balance or default "0.0000"
  const getTokenBalance = (token: Token): string => {
    if (isNativeToken(token) && nativeBalance) return nativeBalance.formatted;
    const possibleAddresses = [
      token.address,
      token.address.toLowerCase(),
      ...(isNativeToken(token)
        ? [NATIVE_TOKEN_ADDRESS, token.symbol, token.symbol.toUpperCase(), token.symbol.toLowerCase()]
        : [])
    ];
    for (const addr of possibleAddresses) {
      if (userBalances[addr]) {
        return userBalances[addr];
      }
    }
    return "0.0000";
  };

  // Fetch token pair details when tokens change
  useEffect(() => {
    const fetchTokenPair = async () => {
      if (chain?.id && fromToken?.symbol && toToken?.symbol) {
        try {
          const pairData = await changelly.getTokenPair(
            chain.id,
            fromToken.symbol,
            toToken.symbol
          );
          setTokenPair(pairData);
          // console.log('Token pair data:', pairData);
        } catch (err) {
          // console.error('Failed to fetch token pair:', err);
        }
      }
    };
    
    fetchTokenPair();
  }, [chain?.id, fromToken?.symbol, toToken?.symbol]);

  // Check if approval is needed
  useEffect(() => {
    const checkApprovalNeeded = async () => {
      if (!chain?.id || !fromToken || !toToken || !fromAmount || !address) return;
      
      // Native tokens don't need approval
      if (isNativeToken(fromToken)) return;
      
      try {
        // Get a standard spender address - this might need adjustment based on your API
        const spenderAddress = "0x1111111254eeb25477b68fb85ed929f73a960582"; // 1inch router
        
        const hasAllowance = await checkAllowance(
          chain.id,
          fromToken.address,
          spenderAddress,
          fromAmount,
          fromToken.decimals
        );
        
        if (!hasAllowance) {
          setApprovalData({
            tokenAddress: fromToken.address,
            spenderAddress,
            amount: fromAmount,
            chainId: chain.id,
            tokenSymbol: fromToken.symbol
          });
        } else {
          setApprovalData(null);
        }
      } catch (err) {
        // console.error('Failed to check allowance:', err);
      }
    };
    
    checkApprovalNeeded();
  }, [chain?.id, fromToken, toToken, fromAmount, address, checkAllowance]);

  // Fetch balances when account or tokens change
  useEffect(() => {
    if (isConnected) {
      fetchUserBalances();
    }
  }, [isConnected, address, chain?.id, nativeBalance?.formatted]);

  // Fetch tokens when chain changes
  useEffect(() => {
    if (chain?.id) {
      fetchTokens();
    }
  }, [chain?.id, fetchTokens]);

  // Reset tokens when chain changes
  useEffect(() => {
    setFromToken(undefined);
    setToToken(undefined);
    setFromAmount('');
    setInputError('');
    setApprovalData(null);
  }, [chain?.id]);

  // Handle amount change with validation
  const handleFromAmountChange = (newAmount: string) => {
    setFromAmount(newAmount);
    if (fromToken) {
      validateAmount(newAmount, fromToken);
    }
  };

  // Set maximum amount
  const handleMaxClick = () => {
    // Special case for native token from wallet
    if (isNativeToken(fromToken) && nativeBalance) {
      setFromAmount(nativeBalance.formatted);
      setInputError('');
      return;
    }
    
    // Find the balance for this token
    if (fromToken) {
      const possibleAddresses = [
        fromToken.address,
        fromToken.address.toLowerCase(),
        ...(isNativeToken(fromToken) ? 
          [NATIVE_TOKEN_ADDRESS, fromToken.symbol, fromToken.symbol.toUpperCase(), fromToken.symbol.toLowerCase()] : [])
      ];
      
      let balance: string | undefined;
      for (const addr of possibleAddresses) {
        if (userBalances[addr]) {
          balance = userBalances[addr];
          break;
        }
      }
      
      if (balance) {
        setFromAmount(balance);
        setInputError('');
      }
    }
  };

  const handleTokenSelect = (token: Token) => {
    if (selectingToken === 'from') {
      if (toToken?.address === token.address) {
        setToToken(fromToken);
      }
      setFromToken(token);
      
      // Validate amount with newly selected token
      if (fromAmount) {
        validateAmount(fromAmount, token);
      }
    } else {
      if (fromToken?.address === token.address) {
        setFromToken(toToken);
      }
      setToToken(token);
    }
    setSelectingToken(null);
    
    // Refresh balances after token selection
    fetchUserBalances();
  };

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSwapClick = () => {
    // First validate that amount doesn't exceed balance
    if (fromToken && validateAmount(fromAmount, fromToken)) {
      // Check if approval is needed
      if (needsApproval && approvalData) {
        // Handle approval flow
        handleApproveToken();
      } else {
        setShowConfirmation(true);
      }
    } else {
      toast.error("Amount exceeds your balance");
    }
  };

  // Function to handle token approval
  const handleApproveToken = async () => {
    if (!approvalData) return;
    
    try {
      const { tokenAddress, spenderAddress, amount, chainId } = approvalData;
      const approved = await approveToken(chainId, tokenAddress, spenderAddress, amount);
      
      if (approved) {
        // If approval was successful, try the swap again
        handleSwap();
      }
    } catch (err) {
      // console.error('Approval failed:', err);
    }
  };

  // Function to cancel approval
  const handleCancelApproval = () => {
    setShowConfirmation(false);
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !isConnected || !chain || !address) return;
    
    // Double-check amount doesn't exceed balance
    if (!validateAmount(fromAmount, fromToken)) {
      toast.error("Amount exceeds your balance");
      return;
    }
    
    setShowConfirmation(false);
    
    try {
      const hash = await executeSwap(
        chain.id,
        fromToken,
        toToken,
        fromAmount,
        slippage
      );

      if (hash) {
        // Transaction was successful
        toast.success("Swap completed successfully!");
        await fetchUserBalances();
        setTransactionHash(hash);
        setShowSuccessModal(true);
        // Reset input
        setFromAmount('');
      }
    } catch (err) {
      // console.error('Swap failed:', err);
      toast.error("Swap failed. Please try again.");
    }
  };

  const switchTokens = () => {
    if (fromToken && toToken) {
      setFromToken(toToken);
      setToToken(fromToken);
      // When switching, validate the toAmount against the new fromToken
      if (toAmount) {
        setFromAmount(toAmount);
        validateAmount(toAmount, toToken);
      } else {
        setFromAmount('');
        setInputError('');
      }
    }
  };

  // Button to manually refresh balances
  const refreshBalances = () => {
    toast.promise(
      fetchUserBalances(),
      {
        loading: 'Refreshing balances...',
        success: 'Balances updated',
        error: 'Failed to refresh balances'
      }
    );
  };

  // If not connected, render a connect wallet UI
  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="mb-6 text-gray-600">Connect your wallet to start swapping tokens</p>
            <button
              onClick={openConnectModal}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow-lg relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Swap Tokens</h2>
          <div className="flex justify-between items-center">
            <ChainSelector />
            <button 
              onClick={refreshBalances}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
              disabled={isLoadingBalances}
            >
              <RefreshCw size={14} className={isLoadingBalances ? "animate-spin" : ""} />
              {isLoadingBalances ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {/* <div className="text-sm text-gray-600 mt-2 flex items-center flex-wrap gap-1">
            <span>Connected to {chain?.name}</span>
            <span>•</span>
            <span className="font-mono">{address?.substring(0, 6)}...{address?.substring(address.length - 4)}</span>
            {nativeBalance && (
              <>
                <span>•</span>
                <span className="font-semibold">{formatBalance(nativeBalance.formatted)} {nativeBalance.symbol}</span>
              </>
            )}
          </div> */}
        </div>

        {/* Approval card */}
        {needsApproval && approvalData && (
          <TokenApprovalCard
            tokenSymbol={approvalData.tokenSymbol}
            onApprove={handleApproveToken}
            onCancel={handleCancelApproval}
            isApproving={isApproving}
          />
        )}

        {chain ? (
          <>
            <TokenInput
              label="You Pay"
              value={fromAmount}
              onChange={handleFromAmountChange}
              onSelectToken={() => setSelectingToken('from')}
              selectedToken={fromToken}
              // Updated balance prop always showing a value
              balance={fromToken ? getTokenBalance(fromToken) : "0.0000"}
              balances={userBalances}
              onMaxClick={handleMaxClick}
            />

            {/* Display error if amount exceeds balance */}
            {inputError && (
              <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
                {inputError}
              </div>
            )}

            <div className="my-4 flex justify-center">
              <button 
                onClick={switchTokens}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                ↓↑
              </button>
            </div>

            <TokenInput
              label="You Receive"
              value={toAmount}
              onChange={() => {}} // Read-only
              onSelectToken={() => setSelectingToken('to')}
              selectedToken={toToken}
              // Updated balance prop for consistency, even for read-only field
              balance={toToken ? getTokenBalance(toToken) : "0.0000"}
              balances={userBalances}
              readOnly
            />

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slippage Tolerance
                </label>
                <select
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="0.5">0.5%</option>
                  <option value="1.0">1.0%</option>
                  <option value="2.0">2.0%</option>
                </select>
              </div>

              {/* Rate and fee info */}
              {fromToken && toToken && fromAmount && toAmount && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Rate</span>
                    <span>
                      1 {fromToken.symbol} = {
                        (Number(toAmount) / Number(fromAmount)).toFixed(6)
                      } {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Fee</span>
                    <span>~ $0.50</span>
                  </div>
                </div>
              )}

              {/* Swap button */}
              <button
                onClick={handleSwapClick}
                disabled={!fromToken || !toToken || !fromAmount || priceLoading || isApproving || !!inputError}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg 
                          disabled:bg-gray-400 hover:bg-blue-700"
              >
                {isApproving
                  ? 'Approving...'
                  : priceLoading
                    ? 'Loading...'
                    : !fromToken || !toToken 
                      ? 'Select Tokens'
                      : !fromAmount 
                        ? 'Enter Amount'
                        : inputError
                          ? 'Insufficient Balance'
                          : needsApproval && approvalData
                            ? `Approve ${approvalData.tokenSymbol}`
                            : 'Swap'}
              </button>

              {/* Error messages */}
              {/* {(priceError || swapError) && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                  {priceError || swapError}
                </div>
              )} */}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-600">
            Please select a network to start swapping
          </div>
        )}

        {/* Token selection modal */}
        {selectingToken && chain && (
          <TokenSelectModal
            isOpen={true}
            onClose={() => setSelectingToken(null)}
            onSelect={handleTokenSelect}
            chainId={chain.id}
            tokens={tokens}
          />
        )}

        {/* Confirmation dialog */}
        {showConfirmation && (
          <SwapConfirmationDialog
            isOpen={true}
            onClose={() => setShowConfirmation(false)}
            onConfirm={handleSwap}
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={fromAmount}
            toAmount={toAmount}
            receiverAddress={address || ''}
          />
        )}
      </div>
      { showSuccessModal && (
        <TransactionSuccessModal 
          isOpen={showSuccessModal} 
          onClose={() => setShowSuccessModal(false)} 
          hash={transactionHash || ''} 
        />
      )}
    </div>
  );
};