/**
 * Enterprise Sidebar Component
 *
 * Enhanced sidebar navigation for LEGAL 3.0 Enterprise features
 * with collapsible sections, quick actions, and firm branding
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  FileText,
  Search,
  BarChart3,
  Scale,
  AlertTriangle,
  Users,
  Settings,
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
  children?: NavItem[];
}

interface EnterpriseSidebarProps {
  firmName?: string;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  collapsed?: boolean;
}

export default function EnterpriseSidebar({
  firmName = 'Your Law Firm',
  userName = 'User',
  userRole = 'Attorney',
  onLogout,
  collapsed = false,
}: EnterpriseSidebarProps) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['documents', 'analytics']);

  const navigation: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Documents',
      href: '/documents',
      icon: FileText,
      badge: 5,
      badgeVariant: 'secondary',
      children: [
        { title: 'All Documents', href: '/documents', icon: FileText },
        { title: 'High Risk', href: '/documents?filter=high-risk', icon: AlertTriangle, badge: 8, badgeVariant: 'destructive' },
        { title: 'Recent', href: '/documents?filter=recent', icon: FileText },
      ],
    },
    {
      title: 'Risk Assessment',
      href: '/risk-assessment',
      icon: AlertTriangle,
    },
    {
      title: 'Case Research',
      href: '/case-research',
      icon: Search,
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      children: [
        { title: 'Overview', href: '/analytics', icon: BarChart3 },
        { title: 'Predictions', href: '/analytics/predictions', icon: Scale },
        { title: 'Settlements', href: '/analytics/settlements', icon: BarChart3 },
        { title: 'Timelines', href: '/analytics/timelines', icon: BarChart3 },
      ],
    },
  ];

  const adminNavigation: NavItem[] = [
    {
      title: 'Firm Management',
      href: '/admin/firm',
      icon: Building2,
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.title);
    const active = isActive(item.href);

    return (
      <div key={item.href}>
        <div className="relative">
          <Link
            to={item.href}
            className={cn(
              'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
              level > 0 && 'pl-9',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              collapsed && 'justify-center px-2'
            )}
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault();
                toggleSection(item.title);
              }
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <item.icon className={cn('h-5 w-5 flex-shrink-0', collapsed && 'h-6 w-6')} />
              {!collapsed && (
                <>
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant || 'default'}
                      className="ml-auto h-5 px-1.5 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </div>
            {!collapsed && hasChildren && (
              <div className="flex-shrink-0 ml-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </Link>
        </div>

        {/* Children */}
        {!collapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div className="flex flex-col h-full border-r bg-card">
        <div className="p-4 flex items-center justify-center border-b">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <nav className="flex-1 p-2 space-y-2">
          {navigation.map((item) => renderNavItem(item))}
        </nav>
        <div className="p-2 space-y-2 border-t">
          {adminNavigation.map((item) => renderNavItem(item))}
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-64 border-r bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{firmName}</h2>
            <p className="text-xs text-muted-foreground truncate">
              LEGAL 3.0 Enterprise
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="p-3 border-b">
        <Button className="w-full justify-start" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((item) => renderNavItem(item))}
      </nav>

      {/* Admin Section */}
      <div className="border-t">
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Administration
          </div>
          {adminNavigation.map((item) => renderNavItem(item))}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t bg-accent/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userRole}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
