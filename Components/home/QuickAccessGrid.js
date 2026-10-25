import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Calendar, Leaf, Store, Map, Info, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function QuickAccessGrid() {
  const items = [
    {
      title: "Events",
      description: "Today's happenings",
      icon: Calendar,
      page: "Events",
      color: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50",
    },
    {
      title: "Activities",
      description: "Farm experiences",
      icon: Leaf,
      page: "Activities",
      color: "from-lime-500 to-lime-600",
      bgLight: "bg-lime-50",
    },
    {
      title: "Shops",
      description: "Cafés & stores",
      icon: Store,
      page: "Shops",
      color: "from-amber-500 to-amber-600",
      bgLight: "bg-amber-50",
    },
    {
      title: "Map",
      description: "Navigate the venue",
      icon: Map,
      page: "MapZones",
      color: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
    },
    {
      title: "About",
      description: "Learn about us",
      icon: Info,
      page: "About",
      color: "from-purple-500 to-purple-600",
      bgLight: "bg-purple-50",
    },
    {
      title: "AI Assistant",
      description: "Ask anything",
      icon: MessageCircle,
      page: "Assistant",
      color: "from-rose-500 to-rose-600",
      bgLight: "bg-rose-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.page}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={createPageUrl(item.page)}
              className="group block bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-lg hover:border-stone-200 transition-all duration-300 h-full"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-1">{item.title}</h3>
              <p className="text-sm text-stone-500">{item.description}</p>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}