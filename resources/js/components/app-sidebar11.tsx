"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"
import { usePage, Link } from "@inertiajs/react"
import { NavMain } from "@/components/nav-main1"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import AppLogo from "./admin-logo"
import { dashboard } from "@/routes"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
// import { title } from "process"
// import { url } from "inspector"

// Sample data
const data = {
  navMain: [
     {
      title: "Admin", 
      url: "admin/profile", //i want remove this so that user can open close this group
      icon: Bot,
      items: [
         {
          title: "Dashboard",
          url: "/admin/dashboard",
        },
        {
          title: "Manage User",
          url: "/facilitate",
        },
        { title: "Profile", url: "/admin/profile" },
       
        {
          title:"Swine Analytics",
          url: "/admin/swine-production",
        },
  
        {
          title:"VetMed Clearance",
          url: "/admin/vetmed-clearances",
        },
         {
          title:"Price Control",
          url: "/admin/price-control/",
        },

     
        // { title: "Quantum", url: "/models/quantum" },
      ],
    },
     {
      title: "Integrated System",
      url: "/admin/dashboard",//i want remove this so that user can open close this group
      icon: SquareTerminal,
      items: [
               {
          title:"Marketplace",
          url: "/marketplace",
        },
         { title: "CMS", url: "/cms/admin/bloglist" },
           {
          title: "Events",
          url: "/admin/events",
        },
      ]
      },
    {
      title: "Swine Management",
      url: "/admin/dashboard",//i want remove this so that user can open close this group
      icon: SquareTerminal,
      items: [
       
        {
          title: "Insurance Application",
          url: "/insurance",
        },
        {
          title: "Veterinary Requests",
          url: "/veterinary/farmers/list?tab=requests",
        },
        
        {
          title: "Veterinary Reports",
          url: "/veterinary-reports/all",
        },
       
      ],
    },
   
    // {
    //   title: "Documentation",
    //   url: "/docs", //i want remove this so that user can open close this group
    //   icon: BookOpen,
    //   items: [
    //     { title: "Introduction", url: "/docs/intro" },
    //     { title: "Get Started", url: "/docs/get-started" },
    //     { title: "Tutorials", url: "/docs/tutorials" },
    //     { title: "Changelog", url: "/docs/changelog" },
    //   ],
    // },
    // {
    //   title: "Settings",
    //   url: "/settingsss",
    //   icon: Settings2,
    // },
  ],
  // projects: [
  //   { name: "Design Engineering", url: "#", icon: Frame },
  //   { name: "Sales & Marketing", url: "#", icon: PieChart },
  //   { name: "Travel", url: "#", icon: Map },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { url } = usePage() // Inertia current route, e.g. "/swine/create"

  // ✅ compute active flags dynamically
  const navMain = data.navMain.map((item) => ({
    ...item,
    isActive: url.startsWith(item.url),
    items: item.items?.map((sub) => ({
      ...sub,
      isActive: url === sub.url,
    })),
  }))

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="#">
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} /> {/* ✅ pass the processed nav */}
        
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
