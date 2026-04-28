'use client';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CartDrawer } from './CartDrawer';
import { ShoppingCart, User, LogOut, LayoutDashboard, LogIn } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuthStore();
  const itemsCount = useCartStore(s => s.items.reduce((a, i) => a + i.quantity, 0));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-bold text-lg">iApteca</Link>
        <div className="flex gap-2">
          <CartDrawer>
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemsCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-sans">{itemsCount}</span>}
            </Button>
          </CartDrawer>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm"><User className="h-4 w-4 mr-2" /> Акаунт</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center"><User className="h-4 w-4 mr-2" /> Профіль</Link>
                </DropdownMenuItem>
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center"><LayoutDashboard className="h-4 w-4 mr-2" /> Адмін</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="h-4 w-4 mr-2" /> Вийти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login" className="flex items-center"><LogIn className="h-4 w-4 mr-2" /> Увійти</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
