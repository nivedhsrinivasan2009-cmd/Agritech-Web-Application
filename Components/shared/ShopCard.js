import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl, isShopOpen } from "../../utils";
import { Clock, MapPin, Coffee, ShoppingBag, Gift, Handshake, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ShopCard({ shop, location }) {
  const typeIcons = {
    cafe: Coffee,
    farm_shop: ShoppingBag,
    partner_outlet: Handshake,
    gift_shop: Gift,
  };

  const typeLabels = {
    cafe: "Café",
    farm_shop: "Farm Shop",
    partner_outlet: "Partner Outlet",
    gift_shop: "Gift Shop",
  };

  const typeColors = {
    cafe: "bg-amber-100 text-amber-700 border-amber-200",
    farm_shop: "bg-green-100 text-green-700 border-green-200",
    partner_outlet: "bg-blue-100 text-blue-700 border-blue-200",
    gift_shop: "bg-pink-100 text-pink-700 border-pink-200",
  };

  const Icon = typeIcons[shop.shop_type] || ShoppingBag;
  const openStatus = isShopOpen(shop.opening_hours);

  return (
    <Link to={`/shops/${shop.id}`} className="block bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {shop.image_url ? (
          <img
            src={shop.image_url}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
            <Icon className="w-16 h-16 text-stone-300" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="outline" className={typeColors[shop.shop_type]}>
            <Icon className="w-3 h-3 mr-1" />
            {typeLabels[shop.shop_type]}
          </Badge>
        </div>
        {openStatus !== null && (
          <div className="absolute top-3 right-3">
            <Badge
              className={cn(
                "border-0 font-medium",
                openStatus
                  ? "bg-green-500 text-white"
                  : "bg-red-100 text-red-700"
              )}
            >
              {openStatus ? "Open" : "Closed"}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-stone-900 mb-2">{shop.name}</h3>
        
        {shop.description && (
          <p className="text-sm text-stone-500 mb-4 line-clamp-2">{shop.description}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 mb-4">
          {shop.opening_hours && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{shop.opening_hours}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{location.zone_name}</span>
            </div>
          )}
        </div>
        
        {shop.location_id && (
          <Link
            to={createPageUrl(`MapZones?zone=${shop.location_id}`)}
            onClick={(e) => e.stopPropagation()}
          >
            <Button className="w-full bg-[#2D5016] hover:bg-[#4A7C23]">
              <Navigation className="w-4 h-4 mr-2" />
              Navigate to Shop
            </Button>
          </Link>
        )}
      </div>
    </Link>
  );
}