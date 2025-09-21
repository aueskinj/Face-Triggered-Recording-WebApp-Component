import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  User, 
  LogOut, 
  Video,
  Menu
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    // You can add navigation logic here when implementing routing
    console.log(`Navigating to ${tab}`);
  };

  const handleSettingsClick = () => {
    console.log('Opening settings');
    // Add settings modal logic here
  };

  const handleProfileClick = () => {
    console.log('Opening profile');
    // Add profile modal logic here
  };

  const handleLogout = () => {
    console.log('Logging out');
    // Add logout logic here
  };

  const handleMenuClick = () => {
    console.log('Opening mobile menu');
    // Add mobile menu logic here
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">FaceRecorder</h1>
            <p className="text-xs text-muted-foreground">Smart Detection System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Button 
            variant={activeTab === 'Dashboard' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => handleNavClick('Dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant={activeTab === 'Library' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => handleNavClick('Library')}
          >
            Library
          </Button>
          <Button 
            variant={activeTab === 'Analytics' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => handleNavClick('Analytics')}
          >
            Analytics
          </Button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleSettingsClick}
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={handleMenuClick}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}