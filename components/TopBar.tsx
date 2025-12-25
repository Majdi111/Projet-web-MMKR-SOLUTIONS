"use client";

import { Bell, Search, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { hoverIcon, tapPress, hoverTransition } from "@/lib/motion";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface PendingOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  clientId: string;
  status: string;
  totalAmount: number;
  createdAt: any;
}

interface TopBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function TopBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search anything...",
  onToggleSidebar,
  isSidebarOpen,
}: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const ordersCollection = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersCollection);
        const pending = ordersSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as PendingOrder))
          .filter(order => order.status === 'Pending');
        
        setPendingOrders(pending);
        setNotifications(pending.length);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };

    fetchPendingOrders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-3 mx-4 md:mx-6 mt-4 mb-2 rounded-2xl border border-border/40
                 bg-white dark:bg-black shadow-lg"
    >
      {/* Left Section - Hamburger Menu */}
      {onToggleSidebar && (
        <motion.div 
          whileHover={hoverIcon}
          whileTap={tapPress}
          transition={hoverTransition}
          className="flex-shrink-0"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="mr-3 md:mr-4 p-2 rounded-xl hover:bg-primary/10 transition-all duration-300 ease-out"
          >
            <motion.div
              animate={isSidebarOpen ? "open" : "closed"}
              className="flex flex-col gap-1.5 w-5 h-5 justify-center items-center"
            >
              <motion.div
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: 45, y: 6 },
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-5 h-0.5 bg-foreground rounded-full"
              />
              <motion.div
                variants={{
                  closed: { opacity: 1, scaleX: 1 },
                  open: { opacity: 0, scaleX: 0 },
                }}
                transition={{ duration: 0.2 }}
                className="w-5 h-0.5 bg-foreground rounded-full"
              />
              <motion.div
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: -45, y: -6 },
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-5 h-0.5 bg-foreground rounded-full"
              />
            </motion.div>
          </Button>
        </motion.div>
      )}

      {/* Center Section - Search Bar */}
      <motion.div 
        className="flex items-center gap-3 flex-1 max-w-md mx-4"
        animate={{
          scale: isSearchFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <div 
          className={`
            flex items-center gap-3 flex-1 bg-muted/40 rounded-xl px-3 md:px-4 py-2.5 
            border transition-all duration-300
            ${isSearchFocused 
              ? 'border-primary/50 ring-2 ring-primary/20 bg-muted/60 shadow-md' 
              : 'border-border/30 hover:bg-muted/50 hover:border-border/50'
            }
          `}
        >
          <motion.div
            animate={{ 
              scale: isSearchFocused ? 1.1 : 1,
              rotate: isSearchFocused ? 90 : 0 
            }}
            transition={{ duration: 0.3 }}
          >
            <Search 
              className={`transition-colors flex-shrink-0 ${
                isSearchFocused ? 'text-primary' : 'text-muted-foreground'
              }`} 
              size={18} 
            />
          </motion.div>
          
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full text-sm text-foreground placeholder:text-muted-foreground font-medium bg-transparent border-none outline-none"
          />
          
          <AnimatePresence>
            {searchValue && (
              <motion.button
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                onClick={() => onSearchChange("")}
                className="flex-shrink-0 p-1 rounded-full hover:bg-primary/10 transition-colors"
              >
                <X size={14} className="text-muted-foreground hover:text-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {/* Theme Toggle */}
        <motion.div whileHover={hoverIcon} whileTap={tapPress} transition={hoverTransition}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full hover:bg-primary/10 transition-all duration-300 ease-out relative overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ y: -20, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 20, opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sun size={18} className="text-yellow-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ y: 20, opacity: 0, rotate: 90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -20, opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Moon size={18} className="text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Notifications */}
        <motion.div whileHover={hoverIcon} whileTap={tapPress} transition={hoverTransition}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative rounded-full hover:bg-primary/10 transition-all duration-300 ease-out"
            onClick={() => setIsDialogOpen(true)}
          >
            <motion.div
              animate={notifications > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <Bell size={18} />
            </motion.div>
            
            <AnimatePresence>
              {notifications > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                >
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {notifications}
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    </motion.header>

    {/* Pending Orders Dialog */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Pending Orders ({notifications})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {pendingOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending orders</p>
          ) : (
            pendingOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => {
                  setIsDialogOpen(false);
                  router.push(`/clients`);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{order.orderNumber}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Client: {order.clientName}</p>
                    <p className="text-xs text-muted-foreground">Amount: ${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold"
                  >
                    {order.status}
                  </motion.div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}