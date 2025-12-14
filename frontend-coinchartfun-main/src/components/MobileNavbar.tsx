import React, { useState, useRef, useEffect } from "react";
import { Search, Menu, ChevronDown, SlidersHorizontal, X, Star } from "lucide-react";
import type { ViewType } from "../types";
import Bubbles from "../../public/Bubbles";
import Settings from "../../public/Settings";
import { SwapCard } from "./Swap/SwapInterface/SwapCard";
import { useFavorites } from "../context/FavoritesContext";
import { useAccount } from "wagmi";
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface MobileNavbarProps {
  onViewChange: (view: ViewType) => void;
  currentView: ViewType;
  selectedRange: string;
  onRangeChange: (range: string) => void;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  activeFilterStrategyId: string | null;
  handleFilterClick: (strategyId: string, event: React.MouseEvent) => void;
  handleFilterOptionClick: (filterKey: keyof Filters, value: boolean) => void;
  filterOptions: Filters;
  selectedToken?: 'binance' | 'btcc' | 'ai';
  setSelectedToken?: (token: 'binance' | 'btcc' | 'ai') => void;
  setCurrentToken?: (token: string) => void;
}

interface Filters {
  skipTraps: boolean;
  avoidHype: boolean;
  minMarketCap: boolean;
}

interface Strategy {
  id: string;
  name: string;
  type: "short" | "long" | "rsi";
}

interface TokenItem {
  id: string;
  name: string;
  type: "binance" | "btcc" | "ai";
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  onViewChange,
  currentView,
  selectedRange,
  onRangeChange,
  onSearchChange,
  showFilters,
  activeFilterStrategyId,
  handleFilterClick,
  handleFilterOptionClick,
  filterOptions,
  selectedToken = 'binance',
  setSelectedToken,
  setCurrentToken
}) => {
  const { isFavorite, addFavorite, removeFavorite, showOnlyFavorites, setShowOnlyFavorites } = useFavorites();
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [showDEX, setShowDEX] = useState(false);
  const [localShowFilters, setLocalShowFilters] = useState(showFilters);
  const [localActiveFilterStrategyId, setLocalActiveFilterStrategyId] = useState<string | null>(activeFilterStrategyId);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [currView, setCurrView] = useState<ViewType>(currentView);
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);

  useEffect(() => {
    setCurrView(currentView);
  }, [currentView]);

  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>([
    { id: "1", name: "Short-Term", type: "short" },
    { id: "2", name: "Long-Term", type: "long" },
    { id: "3", name: "RSI", type: "rsi" },
  ]);

  const allTokens: TokenItem[] = [
    { id: "1", name: "Binance", type: "binance" },
    { id: "2", name: "BTCC", type: "btcc" },
    { id: "3", name: "AI Agents", type: "ai" }
  ];

  // Available range options
  const rangeOptions = ["Top 100", "101 - 200", "201 - 300", "301 - 400"];

  // Add reverseRange helper:
  const reverseRange = (range: string): string => {
    switch (range) {
      case "Top 100":
        return "301 - 400";
      case "101 - 200":
        return "200 - 300";
      case "200 - 300":
        return "100 - 200";
      case "301 - 400":
        return "Top 100";
      default:
        return range;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRangeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleRangeDropdown = () => {
    setShowRangeDropdown(!showRangeDropdown);
  };

  // Modify handleRangeSelect:
  const handleRangeSelect = (range: string) => {
    onRangeChange(reverseRange(range));
    setShowRangeDropdown(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  const handleLocalFilterClick = (strategyId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (localActiveFilterStrategyId === strategyId) {
      setLocalShowFilters(false);
      setLocalActiveFilterStrategyId(null);
    } else {
      setLocalShowFilters(true);
      setLocalActiveFilterStrategyId(strategyId);
    }
  };

  const toggleFavorite = async (symbol: string) => {
    if (!isConnected || !symbol) return;

    if (isFavorite(symbol)) {
      await removeFavorite(symbol);
    } else {
      await addFavorite(symbol);
    }
  };

  const toggleFavoritesFilter = () => {
    setShowOnlyFavorites(!showOnlyFavorites);
  };
  
  // Render token selector (Binance, BTCC, AI Agents)

  const renderTokenSelector = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {allTokens.map(token => {
          const tokenValue = token.type.toLowerCase();
          return (
            <div key={token.id} className="relative">
              {token.type === 'ai' && (
                <div className="absolute -top-2 left-0 right-0 flex justify-center">
                  <div className="bg-black rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 text-xs">
                    <span className="font-medium text-white">Soon</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                  </div>
                </div>
              )}
              <button 
                onClick={() => {
                  if (tokenValue !== 'ai') {
                    // console.log("Button clicked for token:", tokenValue);
                    // Directly set the state first if available
                    if (setSelectedToken) {
                      setSelectedToken(tokenValue as 'binance' | 'btcc' | 'ai');
                    }
                    
                    // If setCurrentToken is available, call it immediately
                    if (setCurrentToken) {
                      // console.log("Calling setCurrentToken with:", tokenValue);
                      setCurrentToken(tokenValue);
                    } else {
                      // console.error("setCurrentToken function is not available");
                    }
                  }
                }}
                className={`cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap ${
                  selectedToken === tokenValue 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                disabled={tokenValue === 'ai'}
              >
                {token.name}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

// New: detect landscape mode
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Add an effect to trigger API call when selectedToken changes (similar to mobile version):
  useEffect(() => {
    // Only for landscape view, mimic the mobile API call behavior.
    if (selectedToken && setCurrentToken) {
      // console.log("Triggering API call for token:", selectedToken);
      // Call the API or any side-effect associated with token change.
      // For example:
      // fetchDataForToken(selectedToken);
    }
  }, [selectedToken]);

  return (
    <>
      {isLandscape ? (
        <div className="fixed top-0 left-0 right-0 h-[12vh] bg-gray-900 z-50 px-4 flex items-center justify-between border-b border-gray-700" style={{ paddingTop: "2vh" }}>
          <div className="flex items-center gap-2">
            <img src="/fav.png" alt="Coinchart.fun" className="w-8 h-8" />
            <span className="text-white font-bold text-lg">Coinchart.fun</span>
            {/* Render search bar only when not in menu view */}
            {currView !== "menu" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-48 h-8 bg-gray-800 text-white pl-10 pr-4 rounded-lg focus:outline-none"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            )}
          </div>
          {/* Unified right-side controls ensuring same header height across views */}
          <div className="flex gap-2 items-center">
            {currView === "chart" 
              ? renderTokenSelector() 
              : currView === "settings" 
                ? (
                  // Render strategy buttons exactly as in settings view
                  <div className="flex gap-2">
                    {selectedStrategies.map(strategy => (
                      <div key={strategy.id} className="relative">
                        {(strategy.type === 'long' || strategy.type === 'rsi') && (
                          <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                            <div className="bg-black rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 text-xs">
                              <span className="font-medium text-white">Soon</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (strategy.type === 'short') {
                              setActiveStrategyId(strategy.id);
                              handleLocalFilterClick(strategy.id, e);
                            }
                          }}
                          className={`px-${strategy.id === "1" ? "2" : "4"} py-1.5 rounded-full flex items-center whitespace-nowrap transition-colors ${
                            strategy.type === "short"
                              ? (strategy.id === activeStrategyId
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-800 text-gray-300 hover:bg-gray-600")
                              : "opacity-75 cursor-default bg-gray-800 text-gray-300"
                          }`}
                          disabled={strategy.type !== 'short'}
                          style={{ fontSize: '0.875rem', padding: strategy.id === "1" ? '0.5rem 0.5rem' : '0.5rem 1rem'}}
                        >
                          {strategy.id === "1" ? "Short" : strategy.name}
                          {strategy.type === "short" && (
                            <span
                              className="filters-button ml-2 cursor-pointer inline-flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLocalFilterClick(strategy.id, e);
                              }}
                            >
                              <SlidersHorizontal size={18} />
                            </span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )
                : null}
            {/* New Favourites button */}
            {(currView === "chart" || currView === "settings") && (
              <button 
                onClick={toggleFavoritesFilter}
                className="flex items-center justify-center w-[30px] h-[30px] ml-2"
                title={showOnlyFavorites ? "Show all tokens" : "Show only favourites"}
              >
                <Star size={20} fill={showOnlyFavorites ? "blue" : "none"} color={showOnlyFavorites ? "blue" : "white"} />
              </button>
            )}
          </div>
        </div>
      ) : (
        // Original topbar for portrait mode
        <div className="fixed top-0 left-0 right-0 h-[8vh] bg-gray-900 z-50 px-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <img src="/fav.png" alt="Logo" className="w-8 h-8" />
            <span className="text-white font-bold">Coinchart.fun</span>
          </div>
          
          {/* Only show search bar and star in chart/settings views */}
          {currentView !== "menu" ? (
            <>
              <div className="flex-1 mx-2">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search Crypto Currencies"
                    className="w-full h-10 bg-gray-800 text-white pl-10 pr-4 rounded-lg focus:outline-none max-w-sm"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              {(currentView === "chart" || currentView === "settings") && (
                <button
                  onClick={toggleFavoritesFilter}
                  className={`flex items-center justify-center w-[30px] h-[30px] ${showOnlyFavorites ? "text-yellow-400" : "text-gray-400"}`}
                >
                  <Star />
                </button>
              )}
            </>
          ) : (
       null
          )}
        </div>
      )}

      {/* SECOND TOPBAR: Render only if NOT in landscape mode */}
      {!isLandscape && (
        currView === "chart" ? (
        /* ONLY render token selector for CHART view */
        <div className="fixed top-[8vh] left-0 right-0 bg-gray-900 z-40 px-4 py-2 border-b border-gray-700">
          {renderTokenSelector()}
        </div>
        ) : currView === "settings" ? (
        /* ONLY render strategy buttons for SETTINGS view */
        <div className="fixed top-[8vh] left-0 right-0 bg-gray-900 z-40 px-4 py-2 border-b border-gray-700">
          <div className="flex gap-2 whitespace-nowrap">
            {selectedStrategies.map((strategy) => (
              <div key={strategy.id} className="relative">
                {strategy.type === "long" || strategy.type === "rsi" ? (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                    <div className="bg-black rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 text-xs">
                      <span className="font-medium text-white">Soon</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    </div>
                  </div>
                ) : null}
                <button
                  className={`px-4 py-1.5 rounded-full ${
                    strategy.type === "short" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                  } ${(strategy.type === "long" || strategy.type === "rsi") ? "opacity-75 cursor-default" : ""}`}
                  disabled={strategy.type === "long" || strategy.type === "rsi"}
                >
                  {strategy.name}
                  {strategy.type === "short" && (
                    <span
                      className="filters-button ml-1 cursor-pointer inline-flex items-center"
                      onClick={(e) => handleLocalFilterClick(strategy.id, e)}
                    >
                      <SlidersHorizontal size={18} className="ml-2" />
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
        ) : currView === "menu" ? (
          /* DO NOT RENDER ANYTHING FOR MENU VIEW */
          null
        ) : null
      )}

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 h-[5vh] z-50 px-4 flex items-center justify-between">
        <div className="relative" ref={dropdownRef}>
          {(currentView === "chart" || currentView === "settings") && (
            <>
              <button
                onClick={toggleRangeDropdown}
                className="flex border mb-4 border-gray-400 bg-[#68686833]/20 items-center gap-1 px-2 py-1 rounded bg-black text-white"
              >
                <span className="text-sm">{selectedRange}</span>
                <ChevronDown size={16} className={showRangeDropdown ? "rotate-180" : ""} />
              </button>
              {showRangeDropdown && (
                <div className="absolute bottom-full left-0  w-32 bg-black border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                  {rangeOptions.map((range, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-800 cursor-pointer text-white text-sm"
                      onClick={() => handleRangeSelect(range)}
                    >
                      {range}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div>
          {(currentView === "chart" || currentView === "settings") && (
            <button
              onClick={() => {
                if (!address && openConnectModal) {
                  // If wallet is not connected, open connect modal first
                  openConnectModal();
                } else {
                  // If wallet is connected, show the DEX
                  setShowDEX(true);
                }
              }}
              className="p-1 border border-white bg-[#68686833]/20  mb-4 h-[30px] rounded-full text-white rounded-lg "
            >
              ↓↑
            </button>
          )}
        </div>

        <div className="flex border border-white rounded-lg mb-4 overflow-hidden">
          <button
            onClick={() => {
              onViewChange("chart");
              setCurrView("chart");
            }}
            className={`flex items-center justify-center w-[60px] h-[30px] ${currentView === "chart" ? "bg-blue-800" : "bg-gray-800"} text-white`}
          >
            <Bubbles />
          </button>
          <button
            onClick={() => {
              onViewChange("settings");
              setCurrView("settings");
            }}
            className={`flex items-center justify-center w-[60px] h-[30px] ${currentView === "settings" ? "bg-blue-800" : "bg-gray-800"} text-white`}
          >
            <Settings />
          </button>
          <button
            onClick={() => {
              onViewChange("menu");
              setCurrView("menu");
            }}
            className={`flex items-center justify-center w-[60px] h-[30px] ${currentView === "menu" ? "bg-blue-800" : "bg-gray-800"} text-white`}
          >
            <Menu />
          </button>
        </div>
      </div>

      {showDEX && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <SwapCard onClose={() => setShowDEX(false)} />
        </div>
      )}

      {localShowFilters && (
        <div 
          className="fixed z-50 bg-gray-800 rounded-lg shadow-lg filters-dropdown"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90%',
            width: '400px'
          }}
        >
          <div className="p-3 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <h3 className="text-white font-medium">Filter Options</h3>
              <button
                onClick={() => {
                  setLocalShowFilters(false);
                  setLocalActiveFilterStrategyId(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={filterOptions.skipTraps}
                  onChange={(e) => handleFilterOptionClick("skipTraps", e.target.checked)}
                  className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                No Market Structure Breaks
              </label>
              <label className="flex items-center gap-2 text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={filterOptions.avoidHype}
                  onChange={(e) => handleFilterOptionClick("avoidHype", e.target.checked)}
                  className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                Avoid Overhyped Tokens
              </label>
              <label className="flex items-center gap-2 text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={filterOptions.minMarketCap}
                  onChange={(e) => handleFilterOptionClick("minMarketCap", e.target.checked)}
                  className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                Skip Potential Traps
              </label>
            </div>
            <div className="pt-2 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setLocalShowFilters(false);
                  setLocalActiveFilterStrategyId(null);
                }}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};