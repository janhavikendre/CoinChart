import React from 'react';
import { Token } from '../../../types/api';

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelectToken: () => void;
  selectedToken?: Token;
  readOnly?: boolean;
  balance?: string;
  onMaxClick?: () => void;
  balances?: Record<string, string>; // Add balances directly to check multiple addresses
}

// Helper function to format balance with appropriate precision
const formatBalance = (balance: string | undefined, decimals = 6): string => {
  if (!balance || balance === '0' || balance === '0.0') return '0.0000';
  
  const balanceNum = parseFloat(balance);
  if (isNaN(balanceNum)) return '0.0000';
  
  // Use scientific notation for extremely small numbers
  if (balanceNum < 0.000001) return balanceNum.toExponential(4);
  
  // For very small numbers, use 6 decimal places
  if (balanceNum < 0.001) return balanceNum.toFixed(6);
  
  // For normal numbers, use 4 decimal places
  return balanceNum.toFixed(4);
};

// Find token balance from multiple possible addresses
const findTokenBalance = (token: Token | undefined, balances: Record<string, string> = {}): string | undefined => {
  if (!token) return undefined;
  
  // Try multiple possible addresses for this token
  const possibleAddresses = [
    token.address,
    token.address.toLowerCase(),
    // For native tokens, also check the canonical address
    ...(token.symbol === 'BNB' || token.symbol === 'ETH' ? 
      ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', token.symbol] : [])
  ];
  
  // Find the first address that has a balance
  for (const addr of possibleAddresses) {
    if (balances[addr]) {
      // console.log(`Found balance for ${token.symbol} under address ${addr}: ${balances[addr]}`);
      return balances[addr];
    }
  }
  
  return undefined;
};

export const TokenInput: React.FC<TokenInputProps> = ({
  label,
  value,
  onChange,
  onSelectToken,
  selectedToken,
  readOnly = false,
  balance,
  onMaxClick,
  balances = {}
}) => {
  // Get token balance considering multiple possible addresses
  const tokenBalance = balance || 
    (selectedToken ? findTokenBalance(selectedToken, balances) : undefined);
  
  // Handle input with balance validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(val)) {
      // If we have a balance and a token, validate against balance
      if (tokenBalance && selectedToken && val !== '') {
        try {
          const inputValue = parseFloat(val);
          const balanceValue = parseFloat(tokenBalance);
          
          // Skip validation if balance is not properly loaded
          if (isNaN(balanceValue)) {
            onChange(val);
            return;
          }
          
          // Only update if input is less than or equal to balance
          if (inputValue <= balanceValue) {
            onChange(val);
          } else {
            // If exceeds, set value to maximum balance
            onChange(tokenBalance);
          }
        } catch (error) {
          // If there's an error parsing (invalid number), allow empty string
          if (val === '') {
            onChange(val);
          }
          // console.error("Error parsing amount:", error);
        }
      } else {
        // If no balance check needed, just update the value
        onChange(val);
      }
    }
  };

  // Create a default max click handler if none provided
  const handleMaxClick = () => {
    if (onMaxClick) {
      onMaxClick();
    } else if (tokenBalance && selectedToken) {
      onChange(tokenBalance);
    }
  };

  // Calculate display balance
  const displayBalance = tokenBalance ? formatBalance(tokenBalance) : '0.0000';

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {tokenBalance !== undefined && selectedToken && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Balance: {displayBalance} {selectedToken.symbol}</span>
            {!readOnly && (
              <button
                onClick={handleMaxClick}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                MAX
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSelectToken}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
        >
          {selectedToken ? (
            <>
              <img 
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
                src={selectedToken.logoURI}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  e.currentTarget.src = '/default-token.png';
                }}
              />
              <span className="font-medium">{selectedToken.symbol}</span>
            </>
          ) : (
            <span>Select Token</span>
          )}
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0.0"
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
};