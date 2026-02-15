"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ChevronDown, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar";

const HIDE_NAVBAR_ROUTES = ["/signin", "/signup", "/forgot-password"];
const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
];

const getUserInitial = (user) => {
    if (!user) return "?";
    const sources = [user.firstName, user.first_name, user.name, user.email];
    for (const source of sources) {
        if (source?.trim()) {
            return source.charAt(0).toUpperCase();
        }
    }
    return "?";
};

const UserAvatar = ({ user, size = "h-9 w-9" }) => {
    const initial = useMemo(() => getUserInitial(user), [user]);
    
    return (
        <Avatar className={size}>
            {user?.profile_photo?.trim() && (
                <AvatarImage src={user.profile_photo} alt={user?.email ?? "User"} />
            )}
            {user?.image?.trim() && (
                <AvatarImage src={user.image} alt={user?.email ?? "User"} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {initial}
            </AvatarFallback>
        </Avatar>
    );
};

const NavLinks = ({ links, className = "" }) => (
    <div className={className}>
        {links.map((link) => (
            <Link 
                key={link.href} 
                href={link.href}
                className="hover:text-primary transition-colors"
            >
                {link.label}
            </Link>
        ))}
    </div>
);

const UserMenu = ({ user, onLogout, align = "end" }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
                variant="ghost"
                className="flex items-center gap-2 pl-2 pr-0"
                aria-label="User menu"
            >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <UserAvatar user={user} />
            </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={align} className="w-44">
            <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600"
            >
                <LogOut className="h-4 w-4" />
                Logout
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const shouldHideNavbar = useMemo(
        () => HIDE_NAVBAR_ROUTES.includes(pathname),
        [pathname]
    );

    const loadUser = useCallback(() => {
        try {
            const storedUser = localStorage.getItem("user");
            
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to load user:", error);
            setUser(null);
        }
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        
        setUser(null);
        setIsSheetOpen(false);
        
        router.push("/signin");
    }, [router]);

    useEffect(() => {
        setIsSheetOpen(false);
    }, [pathname]);

    useEffect(() => {
        setIsMounted(true);
        loadUser();

        const handleStorageChange = (e) => {
            if (e.key === "user" || e.key === "token") {
                loadUser();
            }
        };

        const handleUserUpdate = () => {
            loadUser();
        };

        const pollInterval = setInterval(() => {
            try {
                const currentUser = localStorage.getItem("user");
                const currentUserObj = currentUser ? JSON.parse(currentUser) : null;
                
                setUser((prevUser) => {
                    const prevUserStr = JSON.stringify(prevUser);
                    const currentUserStr = JSON.stringify(currentUserObj);
                    
                    if (prevUserStr !== currentUserStr) {
                        return currentUserObj;
                    }
                    return prevUser;
                });
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 500);

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("userUpdated", handleUserUpdate);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("userUpdated", handleUserUpdate);
            clearInterval(pollInterval);
        };
    }, [loadUser]);

    if (shouldHideNavbar) return null;

    if (!isMounted) {
        return (
            <nav className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link 
                        href="/" 
                        className="text-lg font-semibold tracking-tight hover:text-primary transition-colors"
                    >
                        Gidy
                    </Link>
                    <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                </div>
            </nav>
        );
    }

    return (
        <nav className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                <Link 
                    href="/" 
                    className="text-lg font-semibold tracking-tight hover:text-primary transition-colors"
                >
                   Gidy
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    <NavLinks links={NAV_LINKS} className="flex items-center gap-6" />
                    <UserMenu user={user} onLogout={handleLogout} />
                </div>

                <div className="md:hidden flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-9 w-9 rounded-full p-0"
                                aria-label="User menu"
                            >
                                <UserAvatar user={user} />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                    <User className="h-4 w-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Open menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>

                        <SheetContent side="right" className="w-64">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>

                            <nav className="flex flex-col gap-4 mt-6">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="text-lg hover:text-primary transition-colors"
                                        onClick={() => setIsSheetOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}