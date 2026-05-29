import type { CategoryTab, TopUpGame } from "@/features/home/types/topUpGames.type";

// Placeholder: reuse existing asset until per-game art is available
import placeholder from "@/assets/images/popular_games/popular_games_1.png";
import gameLogo from "@/assets/images/game_logo/mobile_legends.png"

export const GAME_CATEGORIES: CategoryTab[] = [
  { key: "semua", label: "Semua" },
  { key: "moba", label: "MOBA" },
  { key: "battle-royale", label: "Battle Royale" },
  { key: "fps", label: "FPS" },
  { key: "pc-games", label: "PC Games" },
  { key: "voucher", label: "Voucher" },
];

export const TOP_UP_GAMES: TopUpGame[] = [
  // Row 1
  { 
    id: "ml-id-1",       
    title: "Mobile Legends", 
    region: "Indonesia",     
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "moba",          
    borderColor: "azure"  
  },
  { 
    id: "ml-global-1",   
    title: "Mobile Legends", 
    region: "Global",        
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "moba",          
    borderColor: "violet" 
  },
  { 
    id: "ml-my-1",       
    title: "Mobile Legends", 
    region: "Malaysia",      
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "moba",          
    borderColor: "azure"  
  },
  { 
    id: "ff-id-1",       
    title: "Free Fire",      
    region: "Indonesia",     
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "battle-royale", 
    borderColor: "violet" 
  },
  { 
    id: "genshin-1",     
    title: "Genshin Impact", 
    region: "moHoyo",        
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "pc-games",      
    borderColor: "azure"  
  },
  { 
    id: "pubg-1",        
    title: "PUBG Mobile",    
    region: "Level Infinite", 
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "fps",           
    borderColor: "violet" 
  },
  // Row 2
  { 
    id: "ml-global-2",   
    title: "Mobile Legends", 
    region: "Global",        
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "moba",          
    borderColor: "azure"  
  },
  { 
    id: "ml-my-2",       
    title: "Mobile Legends", 
    region: "Malaysia",      
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "moba",          
    borderColor: "violet" 
  },
  { 
    id: "ml-id-2",       
    title: "Mobile Legends", 
    region: "Indonesia",     
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "moba",          
    borderColor: "azure"  
  },
  { 
    id: "genshin-2",     
    title: "Genshin Impact", 
    region: "moHoyo",        
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "pc-games",      
    borderColor: "violet" 
  },
  { 
    id: "pubg-2",        
    title: "PUBG Mobile",    
    region: "Level Infinite", 
    bgImage: placeholder, 
    logoImage: gameLogo, 
    category: "fps",           
    borderColor: "azure"  
  },
  { id: "ff-id-2",       title: "Free Fire",      region: "Indonesia",     bgImage: placeholder, logoImage: gameLogo, category: "battle-royale", borderColor: "violet" },
];
