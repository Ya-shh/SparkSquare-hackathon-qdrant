"use client";

import Link from "next/link";
import { FiFolder, FiMessageSquare, FiUser, FiChevronRight } from "react-icons/fi";
import { motion } from "framer-motion";
import { handleAvatarError } from "@/lib/imageUtils";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  _count: {
    posts: number;
  };
  creator: {
    name: string | null;
    username: string;
    image: string | null;
  };
};

type CategoriesGridProps = {
  categories: Category[];
};

const getEnglishCategoryName = (name: string): string => {
  const latinWords = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "vivo", "confido", 
    "sonitus", "denego", "socius", "enim", "conscendo", "causa", "victus", "cubicularis", "deinde", 
    "toties", "cunctatio", "approbo", "copia", "deripio", "vita", "canonicus", "compello", "audio", 
    "venio", "vilis", "nesciunt", "aureus", "creator", "ara", "basium", "derideo", "officia", "commemoro", 
    "tamquam", "auxilium", "deludo", "reiciendis", "laboriosam", "sapiente", "vesco", "desidero", "tactus", 
    "decimus", "spoliatio", "deserunt", "conservo", "autus", "despecto", "apud", "consequatur", "vis", "videlicet"
  ];
  
  const nameLower = name.toLowerCase();
  const hasLatinWords = latinWords.some(word => nameLower.includes(word));
  
  if (hasLatinWords || !name) {
    const englishNames = [
      "Technology",
      "Science",
      "Business",
      "Health",
      "Arts & Culture",
      "Education",
      "Gaming",
      "Politics",
      "Sports",
      "Travel"
    ];
    return englishNames[Math.floor(Math.random() * englishNames.length)];
  }
  
  return name;
};

const getEnglishDescription = (description: string): string => {
  const latinWords = [
    "lorem ipsum", "vivo", "amet", "confido", "sonitus", "vicinus", "denego", "socius", "cruentus", "ipsum", 
    "dolore", "magna", "consectetur", "adipiscing", "elit", "quis", "coma", "arguo", "enim", "conscendo", 
    "causa", "victus", "cubicularis", "deinde", "toties", "cunctatio", "approbo", "copia", "deripio", "vita", 
    "canonicus", "compello", "audio", "venio", "vilis", "nesciunt", "aureus", "creator", "ara", "basium", 
    "derideo", "officia", "commemoro", "tamquam", "auxilium", "deludo", "reiciendis", "laboriosam", "sapiente", 
    "vesco", "desidero", "tactus", "decimus", "spoliatio", "deserunt", "conservo", "autus", "despecto", "apud", 
    "consequatur", "vis", "videlicet"
  ];
  
  const descriptionLower = description.toLowerCase();
  const hasLatinWords = latinWords.some(word => descriptionLower.includes(word));
  
  if (hasLatinWords || !description) {
    const descriptions = [
      "Discussions about the latest in tech, programming, and digital innovation",
      "Scientific discoveries, research, and discussions",
      "Entrepreneurship, startups, finance, and market trends",
      "Health, wellness, fitness, and medical breakthroughs",
      "Art, literature, music, film, and cultural discussions",
      "Learning resources, educational discussions, and academic topics",
      "Video games, tabletop games, and gaming culture",
      "Current events, political discussions, and policy debates",
      "Sports news, team discussions, and athletic achievements",
      "Travel destinations, tips, and cultural experiences",
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }
  return description;
};

const getEnglishCreatorName = (name: string | null, username: string): string => {
  const latinWords = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "vivo", "confido", 
    "sonitus", "denego", "socius", "enim", "conscendo", "causa", "victus", "cubicularis", "deinde", 
    "toties", "cunctatio", "approbo", "copia", "deripio", "vita", "canonicus", "compello", "audio", 
    "venio", "vilis", "nesciunt", "aureus", "creator", "ara", "basium", "derideo", "officia", "commemoro", 
    "tamquam", "auxilium", "deludo", "reiciendis", "laboriosam", "sapiente", "vesco", "desidero", "tactus", 
    "decimus", "spoliatio", "deserunt", "conservo", "autus", "despecto", "apud", "consequatur", "vis", "videlicet"
  ];
  
  if (!name) return username;
  
  const nameLower = name.toLowerCase();
  const hasLatinWords = latinWords.some(word => nameLower.includes(word));
  
  if (hasLatinWords || name.length < 3) {
    const englishNames = [
      "David Thompson",
      "Sarah Johnson",
      "Michael Chen",
      "Emily Rodriguez",
      "James Wilson",
      "Olivia Martinez",
      "Daniel Kim",
      "Sophia Williams",
      "Ethan Davis",
      "Ava Brown",
      "Alex Taylor",
      "Mia Jones",
      "Ryan Garcia",
      "Isabella Lee",
      "William Miller"
    ];
    
    const nameIndex = username.charCodeAt(0) % englishNames.length;
    return englishNames[nameIndex];
  }
  
  return name;
};

export default function CategoriesGrid({ categories }: CategoriesGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {categories.map((category, index) => (
        <motion.div
          key={category.id}
          variants={itemVariants}
          className="card-modern"
        >
          <Link href={`/categories/${category.slug}`} className="block">
            <div className="p-6 hover:border-indigo-500/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <FiFolder className="h-6 w-6 text-indigo-400" />
                </div>
                <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-1 rounded-full">
                  {category._count.posts} {category._count.posts === 1 ? 'post' : 'posts'}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">{getEnglishCategoryName(category.name)}</h3>
              <p className="text-gray-400 mb-4 line-clamp-2">{getEnglishDescription(category.description)}</p>
              
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex items-center mr-4">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2 border-2 border-indigo-500/50 shadow-sm">
                    {category.creator.image ? (
                      <img
                        src={category.creator.image}
                        alt={category.creator.name || category.creator.username}
                        className="object-cover h-full w-full"
                        onError={(e) => handleAvatarError(e, category.creator.name || category.creator.username)}
                      />
                    ) : (
                      <img
                        src={`https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 70) + 1}.jpg`}
                        alt={category.creator.name || category.creator.username}
                        className="object-cover h-full w-full"
                        onError={(e) => handleAvatarError(e, category.creator.name || category.creator.username)}
                      />
                    )}
                  </div>
                  <span className="font-medium text-indigo-300">{getEnglishCreatorName(category.creator.name, category.creator.username)}</span>
                </div>
                
                <div className="flex items-center">
                  <FiChevronRight className="ml-1" />
                  <span className="text-indigo-400 hover:text-indigo-300">Browse Category</span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
} 