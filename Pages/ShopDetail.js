import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/api/localDataService";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Store,
  Clock,
  MapPin,
  ArrowLeft,
  Share2,
  Navigation,
  Coffee,
  ShoppingBag,
  Gift,
  Handshake,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createPageUrl, isShopOpen } from "../utils";
import { cn } from "@/lib/utils";

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: shop, isLoading } = useQuery({
    queryKey: ["shop", id],
    queryFn: () => api.entities.Shop.get(id),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  const location = locations.find((l) => l.id === shop?.location_id);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name,
          text: shop.description,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const typeConfig = {
    cafe: { icon: Coffee, color: "bg-amber-100 text-amber-700", label: "Café" },
    farm_shop: { icon: ShoppingBag, color: "bg-green-100 text-green-700", label: "Farm Shop" },
    gift_shop: { icon: Gift, color: "bg-pink-100 text-pink-700", label: "Gift Shop" },
    partner_outlet: { icon: Handshake, color: "bg-purple-100 text-purple-700", label: "Partner Outlet" },
  };


  if (isLoading) {
    return (
      <div className="pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-64 rounded-2xl mb-6" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold mb-2">Shop not found</h2>
          <p className="text-stone-500 mb-6">This shop doesn't exist or has been removed.</p>
          <Link to={createPageUrl("Shops")}>
            <Button>View All Shops</Button>
          </Link>
        </div>
      </div>
    );
  }

  const config = typeConfig[shop.shop_type] || typeConfig.farm_shop;
  const TypeIcon = config.icon;
  const openStatus = isShopOpen(shop.opening_hours);

  return (
    <div className="pb-24 lg:pb-8">
      {/* Back Button */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-stone-100 rounded-lg"
            aria-label="Share shop"
          >
            <Share2 className="w-5 h-5 text-stone-600" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero Image */}
        {shop.image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6"
          >
            <img
              src={shop.image_url}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
            {openStatus !== null && (
              <div className="absolute top-4 left-4">
                <Badge className={openStatus ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                  {openStatus ? "Open Now" : "Closed"}
                </Badge>
              </div>
            )}
          </motion.div>
        )}

        {/* Shop Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Type Badge */}
          <div className="flex items-center gap-3 mb-4">
            <Badge className={cn("capitalize", config.color)}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            {openStatus !== null && (
              <Badge
                variant="outline"
                className={openStatus ? "border-green-300 text-green-700" : "border-red-300 text-red-700"}
              >
                {openStatus ? "Open" : "Closed"}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">
            {shop.name}
          </h1>

          {/* Hours & Location */}
          <div className="flex flex-wrap gap-4 mb-6">
            {shop.opening_hours && (
              <div className="flex items-center gap-2 text-stone-600">
                <Clock className="w-5 h-5" />
                <span>{shop.opening_hours}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin className="w-5 h-5" />
                <span>{location.zone_name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-stone max-w-none mb-8">
            <p className="text-stone-600 text-lg leading-relaxed">
              {shop.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {shop.location_id && (
              <Link to={createPageUrl(`MapZones?zone=${shop.location_id}`)} className="flex-1">
                <Button size="lg" className="w-full bg-[#2D5016] hover:bg-[#4A7C23]">
                  <Navigation className="w-5 h-5 mr-2" />
                  Navigate to Shop
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Location Details */}
        {location && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 p-6 bg-stone-50 rounded-2xl"
          >
            <h2 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2D5016]" />
              Location
            </h2>
            <h3 className="font-medium text-stone-900">{location.zone_name}</h3>
            {location.description && (
              <p className="text-stone-600 mt-2">{location.description}</p>
            )}
          </motion.div>
        )}

        {/* What's Available */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-2xl"
        >
          <h2 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-600" />
            What You'll Find Here
          </h2>
          {shop.shop_type === "cafe" && (
            <ul className="space-y-2 text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Fresh farm-to-table meals and snacks
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Specialty coffee and beverages
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Homemade pastries and baked goods
              </li>
            </ul>
          )}
          {shop.shop_type === "farm_shop" && (
            <ul className="space-y-2 text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Fresh seasonal produce
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Free-range eggs and local honey
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Homemade preserves and jams
              </li>
            </ul>
          )}
          {shop.shop_type === "gift_shop" && (
            <ul className="space-y-2 text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Unique souvenirs and keepsakes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Handcrafted local products
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Children's toys and books
              </li>
            </ul>
          )}
          {shop.shop_type === "partner_outlet" && (
            <ul className="space-y-2 text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Eco-friendly products
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Sustainable living essentials
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Local artisan goods
              </li>
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
