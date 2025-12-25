"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Package,
  FileText,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { logout } from "@/lib/auth";
import Image from "next/image";
import { hoverNavItem, tapNavItem, hoverTransition } from "@/lib/motion";


export default function Sidebar({
   isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menu = [
    { name: "Dashboard", icon: Home, path: "/dashboard", color: "from-blue-500 to-blue-600", desc: "Overview & Analytics" },
    { name: "Clients", icon: Users, path: "/clients", color: "from-green-500 to-green-600", desc: "Manage Clients" },
    { name: "Products", icon: Package, path: "/products", color: "from-purple-500 to-purple-600", desc: "Product Catalog" },
    { name: "Invoices", icon: FileText, path: "/invoices", color: "from-orange-500 to-orange-600", desc: "Billing & Invoices" },
  ];

  const bottomMenu = [
    { name: "Settings", icon: Settings, path: "/settings", desc: "App Settings" },
    { name: "Help", icon: HelpCircle, path: "#help", desc: "Get Support" },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      await logout();

      // Replace history entry so browser Back won't resurrect a cached dashboard.
      window.location.replace("/");
      
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      window.location.replace("/");
    }
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-30 lg:hidden"
            onClick={() => setIsCollapsed(true)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isCollapsed ? -256 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-screen w-64 
        bg-gradient-to-b from-white to-gray-50
        dark:from-black dark:to-black
        border-r border-gray-200 dark:border-black
        shadow-xl z-40 overflow-hidden"
      >
        <div className="flex flex-col w-64 h-full p-4">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="absolute top-4 right-4 lg:hidden rounded-full hover:bg-red-500/10 text-red-500 transition-all"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex w-full justify-center"
          >
            <Link
              href="/dashboard"
              aria-label="Go to dashboard"
              onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
              className="block"
            >
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="relative cursor-pointer"
              >
                <Image
                  src="/logo.png"
                  alt="Company Logo"
                  width={155}
                  height={44}
                  className="rounded-xl object-contain"
                  priority
                />
              </motion.div>
            </Link>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {menu.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index + 0.15 }}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="relative"
                >
                  <Link href={item.path} onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}>
                    <motion.div whileHover={hoverNavItem} whileTap={tapNavItem} transition={hoverTransition}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start relative overflow-hidden group transition-all duration-300 ${
                          isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/20 shadow-sm"
                            : "hover:bg-gray-100 dark:hover:bg-black/60"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/60 rounded-r"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}

                        {/* Icon container */}
                        <motion.div
                          className={`p-2 rounded-lg mr-3 ${
                            isActive
                              ? `bg-gradient-to-br ${item.color} shadow-md`
                              : "bg-gray-100 dark:bg-black/70 group-hover:bg-gray-200 dark:group-hover:bg-black"
                          }`}
                          whileHover={{ rotate: [0, -8, 8, -8, 0], scale: 1.15 }}
                          transition={{ duration: 0.5 }}
                        >
                          <item.icon
                            className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-600 dark:text-gray-300"}`}
                          />
                        </motion.div>

                        <span className={`flex-1 font-medium ${isActive && "font-semibold"}`}>
                          {item.name}
                        </span>

                        <ChevronRight
                          className={`h-4 w-4 transition-all duration-300 ${
                            hoveredItem === item.name || isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                          }`}
                        />
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 }}
              className="my-4 border-t border-gray-200 dark:border-black"
            />

            {/* Bottom menu */}
            {bottomMenu.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + 0.05 * index }}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link href={item.path} onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}>
                    <motion.div whileHover={hoverNavItem} whileTap={tapNavItem} transition={hoverTransition}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start transition-all duration-300 ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-gray-100 dark:hover:bg-black/60"
                        }`}
                      >
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                          className="mr-3"
                        >
                          <item.icon className="h-5 w-5" />
                        </motion.div>

                        <span className="font-medium">{item.name}</span>
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-4"
          >
            <Button
              variant="destructive"
              className="w-full hover:scale-[1.02] transition-transform duration-300 ease-out shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}
